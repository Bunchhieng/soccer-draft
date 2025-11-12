// Add this at the beginning of the script section
document.addEventListener('DOMContentLoaded', function () {
  // Initialize instructions panel collapse state
  const instructionsTitle = document.querySelector('.instructions-title');
  const instructionsList = document.querySelector('.instructions-list');

  // Function to toggle instructions
  function toggleInstructions() {
    instructionsList.classList.toggle('collapsed');
    instructionsTitle.classList.toggle('collapsed');

    // Save state to localStorage
    localStorage.setItem('instructionsCollapsed', instructionsList.classList.contains('collapsed'));
  }

  // Add click event listener
  instructionsTitle.addEventListener('click', toggleInstructions);

  // Check localStorage for saved state
  const isCollapsed = localStorage.getItem('instructionsCollapsed') === 'true';
  if (isCollapsed) {
    instructionsList.classList.add('collapsed');
    instructionsTitle.classList.add('collapsed');
  }
});

const DraftManager = (() => {
  const KEY = 'draftData';
  let draggedItem = null;
  let state = {
    teams: [],
    players: [],
    snakeDraft: false,
    currentTurn: 0,
    draftOrder: [],
    editingTeam: null,
    isSettingOrder: false
  };

  function handleDragStart(e) {
    draggedItem = e.target;
    e.target.style.opacity = '0.4';
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleDrop(e) {
    e.preventDefault();
    const dropTarget = e.target.closest('.draft-order-item');
    if (dropTarget && draggedItem !== dropTarget) {
      const allItems = [...dropTarget.parentNode.children];
      const draggedIdx = allItems.indexOf(draggedItem);
      const dropIdx = allItems.indexOf(dropTarget);

      if (draggedIdx < dropIdx) {
        dropTarget.parentNode.insertBefore(draggedItem, dropTarget.nextSibling);
      } else {
        dropTarget.parentNode.insertBefore(draggedItem, dropTarget);
      }
    }
  }

  function handleDragEnd(e) {
    e.target.style.opacity = '';
    draggedItem = null;
  }

  let urlUpdateTimeout = null;
  
  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    // Debounce URL updates to prevent freezing
    if (urlUpdateTimeout) {
      clearTimeout(urlUpdateTimeout);
    }
    urlUpdateTimeout = setTimeout(() => {
      updateURL();
    }, 300); // Wait 300ms before updating URL
  }

  // Create minimal state for URL sharing (exclude UI-only properties)
  function getMinimalState() {
    // Only include teams if they exist
    const teams = state.teams.length > 0 ? state.teams.map(team => ({
      id: team.id,
      name: team.name,
      color: team.color,
      captain: team.captain,
      players: (team.players || []).map(p => ({
        id: p.id,
        name: p.name
      }))
    })) : [];
    
    // Only include draftOrder if teams exist and draftOrder is valid
    const draftOrder = (state.teams.length > 0 && state.draftOrder.length > 0) 
      ? state.draftOrder
          .filter(team => team && team.id) // Filter out invalid entries
          .map(team => team.id) // Store only IDs to save space
      : [];
    
    return {
      teams: teams,
      players: state.players.map(p => ({
        id: p.id,
        name: p.name,
        teamId: p.teamId
      })),
      snakeDraft: state.snakeDraft,
      currentTurn: state.currentTurn,
      draftOrder: draftOrder
    };
  }

  // Encode state to URL-friendly string with compression
  function encodeState() {
    try {
      // Use minimal state to reduce size
      const minimalState = getMinimalState();
      const stateStr = JSON.stringify(minimalState);
      
      // Use LZ-string compression if available, otherwise fallback to base64
      if (typeof LZString !== 'undefined') {
        // Compress the string and encode to base64
        const compressed = LZString.compressToBase64(stateStr);
        // Make it URL-safe
        return compressed
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      } else {
        // Fallback to regular base64 encoding
        return btoa(encodeURIComponent(stateStr))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      }
    } catch (e) {
      console.error('Error encoding state:', e);
      return null;
    }
  }

  // Decode state from URL string with decompression
  function decodeState(encoded) {
    try {
      // Restore base64 padding if needed
      let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      
      let decodedData = null;
      
      // Try LZ-string decompression first, then fallback to regular base64
      if (typeof LZString !== 'undefined') {
        const decompressed = LZString.decompressFromBase64(base64);
        if (decompressed) {
          decodedData = JSON.parse(decompressed);
        }
      }
      
      // Fallback to regular base64 decoding
      if (!decodedData) {
        const decoded = decodeURIComponent(atob(base64));
        decodedData = JSON.parse(decoded);
      }
      
      // Reconstruct full state from minimal state
      if (decodedData && decodedData.teams && decodedData.players) {
        // Rebuild draftOrder from team IDs (only if teams exist)
        let draftOrder = [];
        if (decodedData.draftOrder && Array.isArray(decodedData.draftOrder) && decodedData.teams.length > 0) {
          draftOrder = decodedData.draftOrder
            .map(teamId => {
              if (typeof teamId === 'string') {
                return decodedData.teams.find(t => t && t.id === teamId);
              }
              return null;
            })
            .filter(Boolean);
        }
        
        return {
          teams: decodedData.teams || [],
          players: decodedData.players || [],
          snakeDraft: decodedData.snakeDraft || false,
          currentTurn: decodedData.currentTurn || 0,
          draftOrder: draftOrder,
          editingTeam: null,
          isSettingOrder: false
        };
      }
      
      return decodedData;
    } catch (e) {
      console.error('Error decoding state:', e);
      return null;
    }
  }

  // Update URL with current state
  function updateURL() {
    // Don't update URL if there's no meaningful state
    if (state.teams.length === 0 && state.players.length === 0) {
      // Clear URL if no state
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
      return;
    }

    // Safety check: don't update URL if state is in an invalid state
    // (e.g., draftOrder has invalid references when teams are empty)
    if (state.draftOrder && state.draftOrder.length > 0 && state.teams.length === 0) {
      // Clear invalid draftOrder
      state.draftOrder = [];
    }

    try {
      const encoded = encodeState();
      if (encoded && encoded.length > 0) {
        const newURL = window.location.origin + window.location.pathname + '#' + encoded;
        // Use replaceState to avoid adding to history on every change
        window.history.replaceState(null, '', newURL);
      }
    } catch (e) {
      console.error('Error updating URL:', e);
      // Don't freeze the page if URL update fails
    }
  }

  // Load state from URL
  function loadStateFromURL() {
    const hash = window.location.hash.substring(1); // Remove #
    if (!hash) return false;

    const decoded = decodeState(hash);
    if (decoded && decoded.teams && decoded.players) {
      // Filter out invalid players from the state (allow Unicode characters)
      const invalidPatterns = [/^chrome-/i, /^data$/i, /^http/i, /^https/i, /^file:/i, /^understand/i, /^error/i];
      const isValidPlayerName = (name) => {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        if (trimmed.length < 1) return false;
        // Only filter out invalid patterns, allow Unicode characters
        if (invalidPatterns.some(pattern => pattern.test(trimmed))) return false;
        return trimmed.length > 0;
      };
      
      // Clean players array
      decoded.players = decoded.players.filter(p => isValidPlayerName(p.name));
      
      // Clean players from teams
      decoded.teams = decoded.teams.map(team => ({
        ...team,
        players: team.players.filter(p => isValidPlayerName(p.name))
      }));
      
      // Merge with existing state, preserving UI state
      state = {
        ...decoded,
        editingTeam: null,
        isSettingOrder: false
      };
      
      // Restore snake draft checkbox
      if (document.getElementById('snakeDraft')) {
        document.getElementById('snakeDraft').checked = state.snakeDraft || false;
      }
      
      // No filtering - accept all players from URL state
      
      // Restore players input - need to update the tag-based input
      if (state.players.length > 0) {
        // Filter out invalid players and get only available ones
        const availablePlayers = state.players
          .filter(p => !p.teamId && p.name && typeof p.name === 'string')
          .map(p => p.name.trim())
          .filter(name => {
            // Re-validate player names to filter out any invalid ones (allow Unicode)
            if (name.length < 1) return false;
            const invalidPatterns = [/^chrome-/i, /^data$/i, /^http/i, /^https/i, /^file:/i, /^understand/i, /^error/i];
            if (invalidPatterns.some(pattern => pattern.test(name))) return false;
            return name.length > 0;
          })
          .join(', ');
        const textarea = document.getElementById('players');
        textarea.value = availablePlayers;
        
        // Update the tag-based input if it exists
        const tagsContainer = document.querySelector('.players-tags');
        if (tagsContainer) {
          tagsContainer.innerHTML = '';
          const players = availablePlayers.split(',').map(p => p.trim()).filter(p => p);
          players.forEach(name => {
            const tag = document.createElement('div');
            tag.className = 'player-tag';
            tag.draggable = true;
            tag.dataset.playerName = name;
            tag.innerHTML = `
              <span>${name}</span>
              <span class="remove-tag">×</span>
            `;
            
            // Add drag event listeners
            tag.addEventListener('dragstart', (e) => {
              e.dataTransfer.setData('text/plain', name);
              e.dataTransfer.effectAllowed = 'copy';
              tag.style.opacity = '0.5';
            });
            
            tag.addEventListener('dragend', (e) => {
              tag.style.opacity = '1';
            });
            
            tag.querySelector('.remove-tag').addEventListener('click', () => {
              if (playersSet) {
                playersSet.delete(name);
              }
              tag.remove();
              const remainingPlayers = Array.from(document.querySelectorAll('.player-tag span:not(.remove-tag)'))
                .map(span => span.textContent);
              textarea.value = remainingPlayers.join(', ');
              if (playersTextarea) {
                playersTextarea.value = remainingPlayers.join(', ');
              }
              const container = document.querySelector('.players-input-container');
              container.classList.toggle('empty', remainingPlayers.length === 0);
              const countDisplay = document.querySelector('.players-count');
              if (countDisplay) {
                countDisplay.textContent = `${remainingPlayers.length} player${remainingPlayers.length !== 1 ? 's' : ''}`;
              }
              updatePlayersCount();
            });
            tagsContainer.appendChild(tag);
            
            // Add to playersSet if it exists
            if (playersSet) {
              playersSet.add(name);
            }
          });
          
          // Update count display
          const countDisplay = document.querySelector('.players-count');
          if (countDisplay) {
            countDisplay.textContent = `${players.length} player${players.length !== 1 ? 's' : ''}`;
          }
          const container = document.querySelector('.players-input-container');
          if (container) {
            container.classList.remove('empty');
          }
        }
      }
      
      // Restore draft order list if teams exist
      if (state.teams.length > 0) {
        document.getElementById('draftOrderSection').style.display = 'block';
        renderDraftOrderList();
      }
      
      save(); // Save to localStorage as well
      return true;
    }
    return false;
  }

  // Generate shareable link
  function generateShareLink() {
    const encoded = encodeState();
    if (!encoded) {
      showAlert('Unable to generate share link. Please try again.');
      return null;
    }
    return window.location.origin + window.location.pathname + '#' + encoded;
  }

  // Copy share link to clipboard
  function copyShareLink() {
    // Check if there's anything to share
    if (state.teams.length === 0 && state.players.length === 0) {
      showAlert('Please add some players or teams before sharing.');
      return;
    }
    
    const link = generateShareLink();
    if (!link) {
      showAlert('Unable to generate share link. Please try again.');
      return;
    }

    // Use modern Clipboard API if available
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        showAlert('Link copied to clipboard! Share it with others.');
      }).catch(() => {
        fallbackCopyToClipboard(link);
      });
    } else {
      fallbackCopyToClipboard(link);
    }
  }

  // Fallback copy method for older browsers
  function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      showAlert('Link copied to clipboard! Share it with others.');
    } catch (err) {
      // If copy fails, show the link in an alert
      showAlert('Copy failed. Here is your link:\n\n' + text);
    }
    
    document.body.removeChild(textArea);
  }

  function parsePlayers(input) {
    // Parse players from input, handling @ symbols and Unicode characters
    if (typeof input !== 'string') return [];
    
    // Filter out common invalid patterns
    const invalidPatterns = [
      /^chrome-/i,
      /^data$/i,
      /^http/i,
      /^https/i,
      /^file:/i,
      /^understand/i,
      /^error/i,
      /^this$/i,
      /^the$/i,
      /^is$/i,
      /^at$/i,
      /^and$/i,
      /^or$/i,
      /^to$/i,
      /^of$/i,
      /^in$/i,
      /^on$/i,
      /^for$/i,
      /^with$/i,
      /^from$/i
    ];
    
    return input
      .split(',') // Split by comma
      .map(p => {
        // Trim whitespace
        p = p.trim();
        // Remove @ symbol from the beginning if present
        if (p.startsWith('@')) {
          p = p.substring(1).trim();
        }
        return p;
      })
      .filter(p => {
        // Must have at least 1 character (reduced from 2 to allow single character names)
        if (p.length < 1) return false;
        
        // Check against invalid patterns (browser-related, error messages, etc.)
        if (invalidPatterns.some(pattern => pattern.test(p))) return false;
        
        // Allow names with Unicode characters, letters, spaces, apostrophes, hyphens, commas
        // More lenient validation - just check it's not empty and doesn't match invalid patterns
        // Allow any characters except those that match invalid patterns
        return p.length > 0;
      })
      .map(p => ({
        name: p,
        teamId: null,
        id: crypto.randomUUID()
      }));
  }

  function getContrastColor(hexcolor) {
    // Remove the # if present
    const hex = hexcolor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark colors
    return luminance > 0.7 ? '#000000' : '#ffffff';
  }

  function getContrastTextColor(hexcolor) {
    // If it's white or very light, return a dark color
    if (hexcolor === '#ffffff' || getContrastColor(hexcolor) === '#000000') {
      return '#333333';
    }
    return '#ffffff';  // Otherwise return white
  }

  function render() {
    const draftInterface = document.getElementById('draftInterface');
    const teamSetup = document.querySelectorAll('.team-setup > div');
    const teamsList = document.getElementById('teamsList');
    
    // Use all players in state
    const available = state.players.filter(p => !p.teamId);
    const isDraftComplete = available.length === 0 && state.players.length > 0;
    const isDraftStarted = state.draftOrder.length > 0;

    // Sort available players alphabetically
    available.sort((a, b) => a.name.localeCompare(b.name));

    // Hide setup sections if draft has started
    teamSetup.forEach(div => {
      div.style.display = isDraftStarted ? 'none' : 'block';
    });

    // Hide draft interface and teams list by default
    if (draftInterface) draftInterface.style.display = 'none';
    if (teamsList) teamsList.style.display = 'none';

    if (state.teams.length > 0 && state.players.length > 0) {
      if (isDraftComplete) {
        draftInterface.style.display = 'none';
        const teamsList = document.getElementById('teamsList');
        teamsList.style.display = 'block';
        teamsList.querySelector('.teams-grid').innerHTML = state.teams.map(team => renderTeam(team)).join('');

        // Update action buttons with consistent styling
        const actionButtons = document.getElementById('teamsList').querySelector('.action-buttons');
        actionButtons.innerHTML = `
                    <button class="danger-button" onclick="DraftManager.reset()">
                        <span>🔄</span> New Draft
                    </button>
                    <button class="download-button" onclick="DraftManager.downloadScreenshot()">
                        <span>📸</span> Save as Image
                    </button>
                    <button class="download-button" onclick="DraftManager.exportCSV()">
                        <span>📊</span> Export CSV
                    </button>
                    <button class="download-button" onclick="DraftManager.copyShareLink()">
                        <span>🔗</span> Share Link
                    </button>
                `;
      } else if (isDraftStarted) {
        draftInterface.style.display = 'block';
        document.getElementById('teamsList').style.display = 'none';

        const teamsGrid = draftInterface.querySelector('.teams-grid');
        teamsGrid.innerHTML = state.teams.map(team => renderTeam(team)).join('');

        const availableDiv = document.getElementById('availablePlayers');
        // Safety check: ensure draftOrder is valid
        if (!state.draftOrder || state.draftOrder.length === 0) {
          availableDiv.innerHTML = '<div class="error-message">Error: Draft order is invalid. Please restart the draft.</div>';
        } else if (available.length > 0) {
          const maxPlayersPerTeam = calculateMaxPlayersPerTeam(state);
          let currentTeamIndex = state.currentTurn % state.draftOrder.length;
          let currentTeam = state.draftOrder[currentTeamIndex];
          
          if (!currentTeam) {
            availableDiv.innerHTML = '<div class="error-message">Error: Invalid team in draft order. Please restart the draft.</div>';
          } else {
            // Calculate distribution accounting for remainders (same logic as pickPlayer)
            // Include captains in total count since they're part of the player pool
            const draftedPlayers = state.players.length;
            const captainsCount = state.draftOrder.filter(t => t.captain && t.captain.trim()).length;
            const totalPlayers = draftedPlayers + captainsCount;
            const numTeams = state.draftOrder.length;
            const totalPerTeam = Math.floor(totalPlayers / numTeams);
            const remainder = totalPlayers % numTeams;
            const baseMaxDrafted = totalPerTeam - 1;
            const maxDraftedWithRemainder = totalPerTeam;
            
            const teamsAtBaseMax = state.draftOrder.filter(team => 
              team.players.length >= baseMaxDrafted
            ).length;
            const teamsAtMaxWithRemainder = state.draftOrder.filter(team => 
              team.players.length >= maxDraftedWithRemainder
            ).length;
            
            const allTeamsAtMax = teamsAtBaseMax === numTeams && 
              (remainder === 0 || teamsAtMaxWithRemainder >= remainder);
            
            if (allTeamsAtMax) {
              // All teams are at max, find team with fewest players
              currentTeam = state.draftOrder.reduce((minTeam, team) => 
                team.players.length < minTeam.players.length ? team : minTeam
              );
              currentTeamIndex = state.draftOrder.findIndex(t => t.id === currentTeam.id);
            } else {
              // Find the next team that can take more players
              let loopCount = 0;
              const maxLoops = state.draftOrder.length * 2;
              const initialTurn = state.currentTurn;
              
              while (currentTeam && loopCount < maxLoops) {
                const canTakeBase = currentTeam.players.length < baseMaxDrafted;
                const canTakeRemainder = remainder > 0 && 
                  currentTeam.players.length < maxDraftedWithRemainder &&
                  teamsAtMaxWithRemainder < remainder;
                
                if (canTakeBase || canTakeRemainder) {
                  break;
                }
                
                state.currentTurn++;
                currentTeamIndex = state.currentTurn % state.draftOrder.length;
                currentTeam = state.draftOrder[currentTeamIndex];
                loopCount++;
                
                if (state.currentTurn - initialTurn >= state.draftOrder.length) {
                  currentTeam = state.draftOrder.reduce((minTeam, team) => 
                    team.players.length < minTeam.players.length ? team : minTeam
                  );
                  currentTeamIndex = state.draftOrder.findIndex(t => t.id === currentTeam.id);
                  break;
                }
              }
              
              if (loopCount >= maxLoops || !currentTeam) {
                currentTeam = state.draftOrder.reduce((minTeam, team) => 
                  team.players.length < minTeam.players.length ? team : minTeam
                );
                currentTeamIndex = state.draftOrder.findIndex(t => t.id === currentTeam.id);
              }
            }

            const textColor = getContrastColor(currentTeam.color);
            availableDiv.innerHTML = `
            <div class="available-players-section">
              <div class="current-pick-indicator" style="--team-color: ${currentTeam.color}; color: ${textColor}">
                <div class="pick-info">
                  <div class="pick-number">
                    <span>🎯</span>
                    <span>Pick #${state.currentTurn + 1}</span>
                  </div>
                  <div class="pick-team">
                    <div class="team-color" style="background-color: ${currentTeam.color}"></div>
                    <div class="team-details">
                      <div class="team-name">${currentTeam.name}'s Turn</div>
                    </div>
                  </div>
                </div>
                <button class="stop-draft-btn" onclick="DraftManager.stopDraft()" title="Stop Draft">×</button>
              </div>
              <div class="available-players-header">
                <div class="header-left">
                  <span class="available-players-title">Available Players (${available.length})</span>
                </div>
                <div class="header-right">
                  <button class="share-button" onclick="DraftManager.copyShareLink()" title="Copy shareable link">🔗 Share</button>
                  <button class="danger-button" onclick="DraftManager.reset()">🔄 New Draft</button>
                </div>
              </div>
              <div class="player-list">
                ${available.map(p => `
                  <div class="available-player" 
                       draggable="true"
                       data-player-name="${p.name}"
                       onclick="DraftManager.pickPlayer('${p.id}')"
                       ondragstart="event.dataTransfer.setData('text/plain', '${p.name}'); event.dataTransfer.effectAllowed = 'copy'; this.style.opacity = '0.5';"
                       ondragend="this.style.opacity = '1';">
                    ${['⚽', '🥅', '🏃‍♂️', '⛳', '🎯', '🦶', '🥾', '🏆'][Math.floor(Math.random() * 8)]} ${p.name}
                  </div>
                `).join('')}
              </div>
            </div>
          `;
          }
        } else {
          // Show message when no available players
          availableDiv.innerHTML = '<div class="info-message">No available players. All players have been drafted.</div>';
        }
      }
    } else {
      // Show setup UI when there's no state or incomplete setup
      // Ensure team setup is visible
      teamSetup.forEach(div => {
        div.style.display = 'block';
      });
      if (draftInterface) draftInterface.style.display = 'none';
      if (teamsList) teamsList.style.display = 'none';
    }
  }

  function renderTeam(team) {
    const contrastColor = getContrastColor(team.color);

    const div = document.createElement('div');
    div.className = 'team-col';
    div.style.setProperty('--team-color', team.color);

    div.innerHTML = `
            <div class="team-header" style="background: ${team.color}">
                <div class="team-info">
                    <div>
                        <h3 class="team-name" style="color: ${contrastColor}">${team.name}</h3>
                    </div>
                    <button onclick="DraftManager.editTeam('${team.name}')" 
                            class="edit-button" 
                            style="color: ${contrastColor}; border-color: ${contrastColor}; 
                                   background: rgba(255,255,255,0.1); 
                                   padding: 4px 12px;
                                   border-radius: 4px;
                                   cursor: pointer;
                                   transition: all 0.2s ease;
                                   box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                        Edit Team
                    </button>
                </div>
            </div>
            <div class="player-count">
                ${team.players.length + 1} Player${team.players.length + 1 !== 1 ? 's' : ''}
            </div>
            <div class="team-players">
                <div class="team-player">
                    <div class="team-player-name captain">
                        ${team.captain} (C)
                    </div>
                </div>
                ${team.players.map(p => `
                    <div class="team-player">
                        <div class="team-player-name">
                            ${p.name}
                        </div>
                        <button onclick="DraftManager.removePlayer('${p.id}', '${team.id}')" 
                                class="remove-player-btn" 
                                style="padding: 2px 8px;
                                       border-radius: 4px;
                                       cursor: pointer;
                                       background: rgba(255,0,0,0.1);
                                       border: 1px solid rgba(255,0,0,0.2);
                                       color: #dc2626;
                                       transition: all 0.2s ease;"
                                title="Remove player">×</button>
                    </div>
                `).join('')}
            </div>
        `;
    return div.outerHTML;
  }

  function moveTeam(index, direction) {
    const draftOrderList = document.getElementById('draftOrderList');
    const items = [...draftOrderList.children];

    if (direction === 'up' && index > 0) {
      // Move in DOM
      draftOrderList.insertBefore(items[index], items[index - 1]);
      // Update state.teams array
      [state.teams[index], state.teams[index - 1]] = [state.teams[index - 1], state.teams[index]];
      // Update draft order if draft has started
      if (state.draftOrder.length > 0) {
        [state.draftOrder[index], state.draftOrder[index - 1]] = [state.draftOrder[index - 1], state.draftOrder[index]];
      }
    } else if (direction === 'down' && index < items.length - 1) {
      // Move in DOM
      draftOrderList.insertBefore(items[index + 1], items[index]);
      // Update state.teams array
      [state.teams[index], state.teams[index + 1]] = [state.teams[index + 1], state.teams[index]];
      // Update draft order if draft has started
      if (state.draftOrder.length > 0) {
        [state.draftOrder[index], state.draftOrder[index + 1]] = [state.draftOrder[index + 1], state.draftOrder[index]];
      }
    }

    save();
    renderDraftOrderList();
    render(); // Re-render the entire UI to reflect the new order
  }

  function renderDraftOrderList() {
    const draftOrderList = document.getElementById('draftOrderList');
    draftOrderList.innerHTML = state.teams.map((team, index) => `
            <div class="draft-order-item" draggable="true" data-team-index="${index}">
                <span class="draft-order-handle">⋮⋮</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: ${team.color}"></div>
                    <span>${team.name}</span>
                    <small style="color: #666;">(${team.captain})</small>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                    <div class="draft-order-buttons">
                        <button class="order-button" onclick="DraftManager.moveTeam(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                        <button class="order-button" onclick="DraftManager.moveTeam(${index}, 'down')" ${index === state.teams.length - 1 ? 'disabled' : ''}>↓</button>
                    </div>
                    <button onclick="DraftManager.removeTeam('${team.id}')" class="remove-team-button">✕</button>
                </div>
</div>
        `).join('');

    // Re-add drag and drop functionality
    const items = draftOrderList.querySelectorAll('.draft-order-item');
    items.forEach(item => {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    });
  }

  // Move updatePlayerPosition inside the module
  function updatePlayerPosition(playerId, newPosition) {
    if (playerId.startsWith('captain_')) {
      // Handle captain position update
      const teamId = playerId.replace('captain_', '');
      const team = state.teams.find(t => t.id === teamId);
      if (team) {
        team.captainPosition = newPosition;
        save();
        render();
      }
    } else {
      // Handle regular player position update
      const team = state.teams.find(t => t.players.some(p => p.id === playerId));
      if (!team) return;

      // Update in team's players array
      const player = team.players.find(p => p.id === playerId);
      if (player) {
        player.position = newPosition;
      }

      // Update in main players array
      const mainPlayer = state.players.find(p => p.id === playerId);
      if (mainPlayer) {
        mainPlayer.position = newPosition;
      }

      save();
      render();
    }
  }

  function celebrateDraftCompletion() {
    // Create celebration overlay with enhanced animation
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.innerHTML = `
            <div class="celebration-message">
                <h2>🏆 Draft Complete!</h2>
                <p>All players have been drafted successfully!</p>
                <div style="font-size: 2rem; margin-top: 15px;">⚽</div>
            </div>
        `;
    document.body.appendChild(overlay);

    // Enhanced confetti effect
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = {startVelocity: 30, spread: 360, ticks: 60, zIndex: 0};

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        setTimeout(() => {
          overlay.remove();
        }, 2000);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      // Confetti from multiple angles
      confetti({
        ...defaults,
        particleCount,
        origin: {x: randomInRange(0.1, 0.3), y: Math.random() - 0.2}
      });
      confetti({
        ...defaults,
        particleCount,
        origin: {x: randomInRange(0.7, 0.9), y: Math.random() - 0.2}
      });
    }, 250);

    // Trigger goal animation
    setTimeout(triggerGoalAnimation, 500);
  }

  function pickPlayer(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (!player || player.teamId) return;

    const maxPlayersPerTeam = calculateMaxPlayersPerTeam(state);
    let currentTeamIndex = state.currentTurn % state.draftOrder.length;
    let currentTeam = state.draftOrder[currentTeamIndex];

    // Calculate distribution accounting for remainders
    // Include captains in total count since they're part of the player pool
    const draftedPlayers = state.players.length;
    const captainsCount = state.draftOrder.filter(t => t.captain && t.captain.trim()).length;
    const totalPlayers = draftedPlayers + captainsCount;
    const numTeams = state.draftOrder.length;
    const totalPerTeam = Math.floor(totalPlayers / numTeams);
    const remainder = totalPlayers % numTeams;
    
    // Base max drafted players (excluding captain)
    const baseMaxDrafted = totalPerTeam - 1;
    // Some teams can have 1 more if there's a remainder
    const maxDraftedWithRemainder = totalPerTeam; // totalPerTeam - 1 + 1
    
    // Count teams that can still take the remainder slot
    const teamsAtBaseMax = state.draftOrder.filter(team => 
      team.players.length >= baseMaxDrafted
    ).length;
    const teamsAtMaxWithRemainder = state.draftOrder.filter(team => 
      team.players.length >= maxDraftedWithRemainder
    ).length;
    
    // Check if all teams have reached their max
    const allTeamsAtMax = teamsAtBaseMax === numTeams && 
      (remainder === 0 || teamsAtMaxWithRemainder >= remainder);
    
    if (allTeamsAtMax) {
      // All teams are at max, find team with fewest players for any remaining
      currentTeam = state.draftOrder.reduce((minTeam, team) => 
        team.players.length < minTeam.players.length ? team : minTeam
      );
      currentTeamIndex = state.draftOrder.findIndex(t => t.id === currentTeam.id);
    } else {
      // Find the next team that can take more players
      let loopCount = 0;
      const maxLoops = state.draftOrder.length * 2;
      const initialTurn = state.currentTurn;
      
      while (currentTeam && loopCount < maxLoops) {
        // Check if this team can take more players
        const canTakeBase = currentTeam.players.length < baseMaxDrafted;
        const canTakeRemainder = remainder > 0 && 
          currentTeam.players.length < maxDraftedWithRemainder &&
          teamsAtMaxWithRemainder < remainder;
        
        if (canTakeBase || canTakeRemainder) {
          break;
        }
        
        // This team is at max, move to next
        state.currentTurn++;
        currentTeamIndex = state.currentTurn % state.draftOrder.length;
        currentTeam = state.draftOrder[currentTeamIndex];
        loopCount++;
        
        // If we've cycled through all teams, break to prevent infinite loop
        if (state.currentTurn - initialTurn >= state.draftOrder.length) {
          // Find team with fewest players
          currentTeam = state.draftOrder.reduce((minTeam, team) => 
            team.players.length < minTeam.players.length ? team : minTeam
          );
          currentTeamIndex = state.draftOrder.findIndex(t => t.id === currentTeam.id);
          break;
        }
      }
      
      // If we hit the loop limit, find team with fewest players
      if (loopCount >= maxLoops || !currentTeam) {
        currentTeam = state.draftOrder.reduce((minTeam, team) => 
          team.players.length < minTeam.players.length ? team : minTeam
        );
        currentTeamIndex = state.draftOrder.findIndex(t => t.id === currentTeam.id);
      }
    }

    const teamToUpdate = state.teams.find(team => team.id === currentTeam.id);
    if (!teamToUpdate) return;

    player.teamId = teamToUpdate.id;
    teamToUpdate.players.push(player);

    // Show pick announcement
    const announcement = document.createElement('div');
    announcement.className = 'pick-announcement';
    announcement.innerHTML = `
            <span class="team-dot" style="background-color: ${teamToUpdate.color}"></span>
            <span>
                <span class="highlight">${teamToUpdate.name}</span> picks 
                <span class="highlight">${player.name}</span>
            </span>
            <span>${['🏃‍♂️', '🏃‍♀️', '🤸‍♂️', '🤾', '🏊‍♂️', '🕺', '💃', '🤹‍♂️', '🦸‍♂️', '🦹‍♀️'][Math.floor(Math.random() * 10)]}</span>
        `;
    document.body.appendChild(announcement);

    announcement.addEventListener('animationend', () => {
      announcement.remove();
    });

    const draftOrderTeamIndex = state.draftOrder.findIndex(team => team.id === teamToUpdate.id);
    if (draftOrderTeamIndex !== -1) {
      state.draftOrder[draftOrderTeamIndex] = teamToUpdate;
    }

    state.currentTurn++;

    const availablePlayers = state.players.filter(p => !p.teamId);
    if (availablePlayers.length === 0) {
      celebrateDraftCompletion();
    }

    save();
    render();
  }

  // Add this function to handle responsive text changes
  function updateDraftOrderText() {
    const heading = document.querySelector('.draft-order-text');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
    if (heading) {
        if (isMobile) {
            heading.textContent = 'Use arrow up or down to set draft order';
            heading.style.fontSize = '1rem'; // Smaller font size for mobile
        } else {
            heading.textContent = 'Drag teams to set draft order';
            heading.style.fontSize = '1.2rem'; // Original size for desktop
        }
    }
  }

  function showAlert(message) {
    const customAlert = document.getElementById('customAlert');
    const overlay = document.getElementById('alertOverlay');
    
    // Update alert content
    customAlert.querySelector('.custom-alert-title').textContent = 'Notice';
    customAlert.querySelector('.custom-alert-content').textContent = message;
    
    // Update buttons
    const buttonsContainer = customAlert.querySelector('.custom-alert-buttons');
    buttonsContainer.innerHTML = `
        <button class="custom-alert-confirm" onclick="DraftManager.closeAlert()">Got it</button>
    `;
    
    // Show alert
    overlay.style.display = 'block';
    customAlert.style.display = 'block';
  }

  // Add this helper function to calculate max players per team
  function calculateMaxPlayersPerTeam(state) {
    // Calculate max drafted players per team
    // Captains are NOT in team.players array, they're stored separately in team.captain
    // But captains ARE part of the total player pool
    // So if we have 32 players total (including 4 captains) and 4 teams:
    // - Each team gets 32/4 = 8 players total (including captain)
    // - Since captain is separate, max drafted players = 8 - 1 = 7
    
    // Count total players: drafted players + captains
    const draftedPlayers = state.players.length;
    const captainsCount = state.teams.filter(t => t.captain && t.captain.trim()).length;
    const totalPlayers = draftedPlayers + captainsCount;
    
    const numTeams = state.teams.length;
    if (numTeams === 0) return 0;
    
    // Total players per team (including captain)
    const totalPerTeam = Math.floor(totalPlayers / numTeams);
    
    // Max drafted players = total per team - 1 (for captain)
    return totalPerTeam - 1;
  }

  // Make teams-input-container a drop zone for creating teams
  function initTeamsContainerDragDrop() {
    const teamsContainer = document.querySelector('.teams-input-container');
    if (!teamsContainer) return;
    
    // Remove existing listeners to avoid duplicates
    const newContainer = teamsContainer.cloneNode(true);
    teamsContainer.parentNode.replaceChild(newContainer, teamsContainer);
    
    newContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      newContainer.style.backgroundColor = '#e8f5e9';
      newContainer.style.border = '2px dashed #4CAF50';
    });
    
    newContainer.addEventListener('dragleave', (e) => {
      // Only remove highlight if we're actually leaving the container
      if (!newContainer.contains(e.relatedTarget)) {
        newContainer.style.backgroundColor = '';
        newContainer.style.border = '';
      }
    });
    
    newContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const playerName = e.dataTransfer.getData('text/plain');
      if (playerName) {
        createTeamFromDroppedPlayer(playerName);
        newContainer.style.backgroundColor = '';
        newContainer.style.border = '';
      }
    });
  }

  // Make all captain inputs droppable
  function initCaptainInputsDragDrop() {
    document.querySelectorAll('.captain-input').forEach(captainInput => {
      // Remove existing listeners to avoid duplicates
      const newInput = captainInput.cloneNode(true);
      captainInput.parentNode.replaceChild(newInput, captainInput);
      
      newInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        newInput.style.backgroundColor = '#e8f5e9';
      });
      
      newInput.addEventListener('dragleave', (e) => {
        newInput.style.backgroundColor = '';
      });
      
      newInput.addEventListener('drop', (e) => {
        e.preventDefault();
        const playerName = e.dataTransfer.getData('text/plain');
        if (playerName) {
          newInput.value = playerName;
          newInput.style.backgroundColor = '#c8e6c9';
          setTimeout(() => {
            newInput.style.backgroundColor = '';
          }, 500);
        }
      });
    });
  }

  // Store players Set globally so we can access it from other functions
  let playersSet = null;
  let playersTagsContainer = null;
  let playersTextarea = null;
  let playersCountDisplay = null;

  function removePlayerFromList(playerName) {
    if (!playersSet || !playersTagsContainer) return false;
    
    const trimmedName = playerName.trim();
    if (!playersSet.has(trimmedName)) return false;
    
    // Find and remove the tag
    const tags = playersTagsContainer.querySelectorAll('.player-tag');
    for (const tag of tags) {
      const tagName = tag.dataset.playerName || tag.querySelector('span')?.textContent?.trim();
      if (tagName === trimmedName) {
        tag.remove();
        playersSet.delete(trimmedName);
        updatePlayersCount();
        return true;
      }
    }
    
    return false;
  }

  function updatePlayersCount() {
    if (!playersCountDisplay || !playersSet || !playersTextarea) return;
    playersCountDisplay.textContent = `${playersSet.size} player${playersSet.size !== 1 ? 's' : ''}`;
    const container = playersTagsContainer?.parentElement;
    if (container) {
      container.classList.toggle('empty', playersSet.size === 0);
    }
    // Update hidden textarea for compatibility
    if (playersTextarea) {
      playersTextarea.value = Array.from(playersSet).join(', ');
    }
    
    // Sync tags with playersSet - ensure all players in the set have tags
    if (playersTagsContainer && playersSet) {
      const existingTags = Array.from(playersTagsContainer.querySelectorAll('.player-tag'))
        .map(tag => tag.dataset.playerName || tag.querySelector('span')?.textContent?.trim())
        .filter(Boolean);
      
      const playersInSet = Array.from(playersSet);
      
      // Add tags for players that are in the set but don't have tags
      playersInSet.forEach(playerName => {
        if (!existingTags.includes(playerName)) {
          // Create tag for this player
          const tag = document.createElement('div');
          tag.className = 'player-tag';
          tag.draggable = true;
          tag.dataset.playerName = playerName;
          tag.innerHTML = `
            <span>${playerName}</span>
            <span class="remove-tag">×</span>
          `;
          
          // Add drag event listeners
          tag.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', playerName);
            e.dataTransfer.effectAllowed = 'copy';
            tag.style.opacity = '0.5';
          });
          
          tag.addEventListener('dragend', (e) => {
            tag.style.opacity = '1';
          });
          
          tag.querySelector('.remove-tag').addEventListener('click', () => {
            playersSet.delete(playerName);
            tag.remove();
            updatePlayersCount();
          });
          
          playersTagsContainer.appendChild(tag);
        }
      });
      
      // Remove tags for players that are no longer in the set
      existingTags.forEach(tagName => {
        if (!playersInSet.includes(tagName)) {
          const tag = playersTagsContainer.querySelector(`[data-player-name="${tagName}"]`) ||
                      Array.from(playersTagsContainer.querySelectorAll('.player-tag'))
                        .find(t => (t.dataset.playerName || t.querySelector('span')?.textContent?.trim()) === tagName);
          if (tag) {
            tag.remove();
          }
        }
      });
    }
    
    // Update state.players to sync with the tag system for URL sharing
    // Only update if draft hasn't started (draftOrder is empty)
    if (state.draftOrder.length === 0) {
      const playerNames = Array.from(playersSet);
      // Create player objects for state.players, preserving existing IDs if players already exist
      state.players = playerNames.map(name => {
        // Check if player already exists in state
        const existing = state.players.find(p => p.name === name);
        if (existing) {
          return existing; // Keep existing player with its ID
        }
        // Create new player object
        return {
          id: crypto.randomUUID(),
          name: name,
          teamId: null
        };
      });
      
      // Remove players that are no longer in the set
      state.players = state.players.filter(p => playerNames.includes(p.name));
      
      // Save state to update URL
      save();
    }
  }

  function initPlayersInput() {
    const container = document.createElement('div');
    container.className = 'players-input-container empty';
    
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'players-tags';
    playersTagsContainer = tagsContainer;
    
    const input = document.createElement('input');
    input.className = 'players-input';
    input.type = 'text';
    input.placeholder = '';
    
    const countDisplay = document.createElement('div');
    countDisplay.className = 'players-count';
    playersCountDisplay = countDisplay;
    
    container.appendChild(tagsContainer);
    container.appendChild(input);
    container.appendChild(countDisplay);
    
    // Replace the textarea with our new input
    const textarea = document.getElementById('players');
    textarea.style.display = 'none';
    textarea.parentNode.insertBefore(container, textarea);
    playersTextarea = textarea;
    
    let players = new Set();
    playersSet = players;
    
    function updateCount() {
      updatePlayersCount();
    }
    
    function addPlayer(name) {
        name = name.trim();
        if (!name) return;
        
        if (players.has(name)) {
            input.value = '';
            return;
        }
        
        players.add(name);
        
        const tag = document.createElement('div');
        tag.className = 'player-tag';
        tag.draggable = true;
        tag.dataset.playerName = name;
        tag.innerHTML = `
            <span>${name}</span>
            <span class="remove-tag">×</span>
        `;
        
        // Add drag event listeners
        tag.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', name);
            e.dataTransfer.effectAllowed = 'copy';
            tag.style.opacity = '0.5';
        });
        
        tag.addEventListener('dragend', (e) => {
            tag.style.opacity = '1';
        });
        
        tag.querySelector('.remove-tag').addEventListener('click', () => {
            players.delete(name);
            tag.remove();
            updatePlayersCount();
        });
        
        tagsContainer.appendChild(tag);
        input.value = '';
        updateCount();
    }
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const names = input.value.split(',').map(n => n.trim()).filter(n => n.length > 0);
            names.forEach(name => addPlayer(name));
            input.value = ''; // Clear input after adding
        }
    });
    
    input.addEventListener('paste', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const paste = (e.clipboardData || window.clipboardData).getData('text');
        if (paste && paste.trim()) {
            // When user pastes, allow all names
            const names = paste.split(/[,\n]/).map(n => n.trim()).filter(n => n.length > 0);
            names.forEach(name => addPlayer(name));
            input.value = ''; // Clear input after paste
        }
    });
    
    // Load existing players from state.players first (if available), then from textarea
    // This ensures all players from state are loaded, not just what's in the textarea
    if (state.players && state.players.length > 0 && state.draftOrder.length === 0) {
        // Load from state.players (most accurate source)
        const playerNames = state.players
            .filter(p => !p.teamId) // Only undrafted players
            .map(p => p.name)
            .filter(name => name && name.trim().length > 0);
        
        playerNames.forEach(name => {
            if (!players.has(name)) {
                addPlayer(name);
            }
        });
    } else if (textarea.value) {
        // Fallback to textarea if no state.players - load all names without filtering
        const allNames = textarea.value.split(',').map(n => n.trim()).filter(n => n.length > 0);
        allNames.forEach(name => {
            if (!players.has(name)) {
                addPlayer(name);
            }
        });
    }
    
    container.addEventListener('click', () => input.focus());
  }

  function addTeamInput() {
    const teamsList = document.querySelector('.teams-list');
    const teamRow = document.createElement('div');
    teamRow.className = 'team-input-row';
    
    teamRow.innerHTML = `
        <div class="team-input-group">
            <label>Team Name</label>
            <input type="text" class="team-name-input" placeholder="Enter team name">
        </div>
        <div class="team-input-group">
            <label>Captain Name</label>
            <input type="text" class="captain-input" placeholder="Enter captain name">
        </div>
        <div class="team-color-input">
            <label>Team Color</label>
            <div class="color-options">
                <div class="color-option" style="background: #ffffff" data-color="#ffffff"></div>
                <div class="color-option" style="background: #3182ce" data-color="#3182ce"></div>
                <div class="color-option" style="background: #e53e3e" data-color="#e53e3e"></div>
                <div class="color-option" style="background: #38a169" data-color="#38a169"></div>
                <div class="color-option" style="background: #805ad5" data-color="#805ad5"></div>
                <div class="color-option" style="background: #d69e2e" data-color="#d69e2e"></div>
            </div>
            <input type="color" class="team-color-picker" value="#ffffff">
        </div>
        <button class="remove-team-input" onclick="DraftManager.removeTeamInput(this)">×</button>
    `;
    
    // Add color option click handlers
    teamRow.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            teamRow.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            teamRow.querySelector('.team-color-picker').value = option.dataset.color;
        });
    });
    
    // Make captain input droppable
    const captainInput = teamRow.querySelector('.captain-input');
    captainInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        captainInput.style.backgroundColor = '#e8f5e9';
    });
    
    captainInput.addEventListener('dragleave', (e) => {
        captainInput.style.backgroundColor = '';
    });
    
    captainInput.addEventListener('drop', (e) => {
        e.preventDefault();
        const playerName = e.dataTransfer.getData('text/plain');
        if (playerName) {
            captainInput.value = playerName;
            captainInput.style.backgroundColor = '#c8e6c9';
            setTimeout(() => {
                captainInput.style.backgroundColor = '';
            }, 500);
        }
    });
    
    teamsList.appendChild(teamRow);
    return teamRow;
  }

  // Function to create team from dropped player
  function createTeamFromDroppedPlayer(playerName) {
    const teamRow = addTeamInput();
    const captainInput = teamRow.querySelector('.captain-input');
    if (captainInput) {
      captainInput.value = playerName;
      captainInput.style.backgroundColor = '#c8e6c9';
      setTimeout(() => {
        captainInput.style.backgroundColor = '';
      }, 500);
    }
    // Remove player from list
    removePlayerFromList(playerName);
    return teamRow;
  }

  function removeTeamInput(button) {
    const row = button.closest('.team-input-row');
    row.classList.add('removing');
    setTimeout(() => row.remove(), 300);
  }

  function saveTeams() {
    const teamRows = document.querySelectorAll('.team-input-row');
    let hasError = false;
    
    teamRows.forEach(row => {
        const teamName = row.querySelector('.team-name-input').value.trim();
        const captainName = row.querySelector('.captain-input').value.trim();
        
        if (!teamName || !captainName) {
            hasError = true;
            row.style.border = '1px solid #ef4444';
            setTimeout(() => row.style.border = 'none', 2000);
        }
    });
    
    if (hasError) {
        showAlert('Please fill in all team names and captains');
        return;
    }
    
    teamRows.forEach(row => {
        const teamName = row.querySelector('.team-name-input').value.trim();
        const captainName = row.querySelector('.captain-input').value.trim();
        const teamColor = row.querySelector('.team-color-picker').value;
        
        state.teams.push({
            id: crypto.randomUUID(),
            name: teamName,
            color: teamColor,
            captain: captainName,
            players: []
        });
    });
    
    document.getElementById('draftOrderSection').style.display = 'block';
    renderDraftOrderList();
    save();
    render();
  }

  return {
    init() {
      // Check for state in URL first (shared link takes priority)
      const urlStateLoaded = loadStateFromURL();
      
      // Only load from localStorage if no URL state was found
      if (!urlStateLoaded) {
        const saved = localStorage.getItem(KEY);
        if (saved) {
          const savedState = JSON.parse(saved);
          // Ensure we restore all state properties
          state = {
            teams: savedState.teams || [],
            players: savedState.players || [],
            snakeDraft: savedState.snakeDraft || false,
            currentTurn: savedState.currentTurn || 0,
            draftOrder: savedState.draftOrder || [],
            editingTeam: null,
            isSettingOrder: savedState.isSettingOrder || false
          };

          // No filtering - accept all players from localStorage

          // Restore UI state
          if (state.players.length > 0) {
            document.getElementById('players').value = state.players
              .filter(p => !p.teamId) // Only show undrafted players
              .map(p => p.name)
              .join(', ');
          }

          // Restore snake draft checkbox
          document.getElementById('snakeDraft').checked = state.snakeDraft;

          // Update draft order list if draft has started
          if (state.draftOrder.length > 0) {
            const draftOrderList = document.getElementById('draftOrderList');
            draftOrderList.innerHTML = state.teams.map((team, index) => `
                  <div class="draft-order-item" draggable="true" data-team-index="${index}">
                      <span class="draft-order-handle">⋮⋮</span>
                      <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="width: 12px; height: 12px; border-radius: 50%; background: ${team.color}"></div>
                          <span>${team.name}</span>
                          <small style="color: #666;">(${team.captain})</small>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px;">
                          <div class="draft-order-buttons">
                              <button class="order-button" onclick="DraftManager.moveTeam(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                              <button class="order-button" onclick="DraftManager.moveTeam(${index}, 'down')" ${index === state.teams.length - 1 ? 'disabled' : ''}>↓</button>
                          </div>
                          <button onclick="DraftManager.removeTeam('${team.id}')" class="remove-team-button">✕</button>
                      </div>
                  </div>
              `).join('');

            // Add drag and drop functionality
            const items = draftOrderList.querySelectorAll('.draft-order-item');
            items.forEach(item => {
              item.addEventListener('dragstart', handleDragStart);
              item.addEventListener('dragover', handleDragOver);
              item.addEventListener('drop', handleDrop);
              item.addEventListener('dragend', handleDragEnd);
            });
          }
        }
      }
      
      // Add snake draft switch listener
      const snakeDraftSwitch = document.getElementById('snakeDraft');
      const typeText = document.getElementById('draftTypeText');
      const description = document.getElementById('draftDescription');

      // Set initial text based on saved state
      if (state.snakeDraft) {
        typeText.textContent = 'Snake Draft';
        description.textContent = 'A→B→C, C→B→A';
        snakeDraftSwitch.checked = true;  // Ensure switch is ON for snake draft
      } else {
        typeText.textContent = 'Classic Draft';
        description.textContent = 'A→B→C, A→B→C';
        snakeDraftSwitch.checked = false;  // Ensure switch is OFF for classic draft
      }

      // Update the snake draft switch listener
      snakeDraftSwitch.addEventListener('change', function(e) {
        if (e.target.checked) {
          typeText.textContent = 'Snake Draft';
          description.textContent = 'A→B→C, C→B→A';
        } else {
          typeText.textContent = 'Classic Draft';
          description.textContent = 'A→B→C, A→B→C';
        }
        
        // Update state and draft order
        state.snakeDraft = e.target.checked;
        
        // Update draft order if draft has started
        if (state.draftOrder.length > 0) {
          state.draftOrder = this.generateDraftOrder();
        }
        
        save();
        render();
      });
      
      // Call updateDraftOrderText after a short delay to ensure DOM is ready
      setTimeout(updateDraftOrderText, 100);
      
      // Add resize listener for responsive text
      window.addEventListener('resize', updateDraftOrderText);
      
        initPlayersInput();
        initCaptainInputsDragDrop();
        initTeamsContainerDragDrop();
        
        // If URL state was loaded, render it; otherwise render from localStorage
        if (urlStateLoaded) {
          render();
        } else {
          render();
        }
        
        // Re-initialize drag-drop after a short delay to ensure DOM is ready
        setTimeout(() => {
          initCaptainInputsDragDrop();
          initTeamsContainerDragDrop();
        }, 100);
    },

    stopDraft() {
      // Reset state completely
      state = {
        teams: [],
        players: [],
        snakeDraft: false,
        currentTurn: 0,
        draftOrder: [],
        editingTeam: null,
        isSettingOrder: false
      };

      // Reset all form inputs
      document.getElementById('players').value = '';
      document.getElementById('teamName').value = '';
      document.getElementById('captain').value = '';
      document.getElementById('snakeDraft').checked = false;
      document.getElementById('teamColor').value = '#ffffff';

      // Clear the players input container
      const tagsContainer = document.querySelector('.players-tags');
      if (tagsContainer) {
        tagsContainer.innerHTML = '';
      }
      
      // Reset container state and count
      const container = document.querySelector('.players-input-container');
      if (container) {
        container.classList.add('empty');
      }
      const countDisplay = document.querySelector('.players-count');
      if (countDisplay) {
        countDisplay.textContent = '0 players';
      }

      // Clear color selections
      document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
      });

      // Reset UI sections
      document.getElementById('draftOrderSection').style.display = 'none';
      document.getElementById('draftInterface').style.display = 'none';
      document.getElementById('teamsList').style.display = 'none';
      document.getElementById('availablePlayers').innerHTML = '';
      document.getElementById('draftOrderList').innerHTML = '';

      // Show setup sections again
      document.querySelectorAll('.team-setup > div').forEach(div => {
        div.style.display = 'block';
      });

      document.querySelector('.draft-controls').style.display = 'block';
      document.getElementById('currentTurn').style.display = 'block';

      // Clear localStorage
      localStorage.removeItem(KEY);
      localStorage.removeItem('instructionsCollapsed');

      render();
    },

    addTeam() {
      const team = {
        id: crypto.randomUUID(),
        name: document.getElementById('teamName').value,
        color: document.getElementById('teamColor').value,
        captain: document.getElementById('captain').value,
        players: []
      };

      if (!team.name || !team.captain) {
        showAlert('Please fill in team name and captain!');
        return;
      }

      state.teams.push(team);
      document.getElementById('teamName').value = '';
      document.getElementById('captain').value = '';

      document.getElementById('draftOrderSection').style.display = 'block';
      renderDraftOrderList();

      // Show teams grid
      const draftInterface = document.getElementById('draftInterface');
      draftInterface.style.display = 'block';
      const teamsGrid = draftInterface.querySelector('.teams-grid');
      teamsGrid.innerHTML = state.teams.map(team => renderTeam(team)).join('');

      save();
      render();
      updateDraftOrderText();
    },

    startDraft(showWarning = false) {
      try {
        if (state.teams.length < 2) {
          showAlert('Please add at least 2 teams!');
          return;
        }

      // Get players from textarea (which is updated by the tag system)
      const playerInput = document.getElementById('players').value;
      
      // Also check if there are player tags (tag-based input system)
      const tagsContainer = document.querySelector('.players-tags');
      let playerNames = [];
      
      if (tagsContainer && tagsContainer.children.length > 0) {
        // Get players from tags
        playerNames = Array.from(tagsContainer.querySelectorAll('.player-tag span:not(.remove-tag)'))
          .map(span => span.textContent.trim())
          .filter(name => name.length > 0);
      }
      
      // Fallback to textarea if no tags
      const finalPlayerInput = playerNames.length > 0 
        ? playerNames.join(', ') 
        : playerInput;
      
      if (!finalPlayerInput.trim()) {
        showAlert('Please enter some players!');
        return;
      }

      // Auto-collapse instructions when draft starts
      const instructionsList = document.querySelector('.instructions-list');
      const instructionsTitle = document.querySelector('.instructions-title');
      if (instructionsList && instructionsTitle) {
        instructionsList.classList.add('collapsed');
        instructionsTitle.classList.add('collapsed');
        // Save collapsed state to localStorage
        localStorage.setItem('instructionsCollapsed', 'true');
      }

      // Get the draft order from the current order in the list
      const draftOrderList = document.getElementById('draftOrderList');
      let orderedTeams = [];
      
      if (draftOrderList && draftOrderList.children.length > 0) {
        // Use the order from the DOM if available
        orderedTeams = [...draftOrderList.children].map(item => {
          const index = parseInt(item.dataset.teamIndex);
          if (index >= 0 && index < state.teams.length) {
            return state.teams[index];
          }
          return null;
        }).filter(Boolean);
      }
      
      // Fallback: if no draft order list or empty, use current teams order
      if (orderedTeams.length === 0 || orderedTeams.length !== state.teams.length) {
        orderedTeams = [...state.teams];
      }

      // Update the teams array to match the new order
      state.teams = [...orderedTeams];
      
      // Parse players from input - parsePlayers already filters invalid patterns
      const parsedPlayers = parsePlayers(finalPlayerInput);
      
      if (parsedPlayers.length < 2) {
        // Show helpful error message
        const rawInput = finalPlayerInput.split(',').map(p => p.trim()).filter(p => p.length > 0);
        const validCount = parsedPlayers.length;
        if (validCount === 0) {
          showAlert(`No valid players found! Please enter at least 2 valid player names (separated by commas).`);
        } else {
          showAlert(`You have ${validCount} valid player(s), but need at least 2. Please add more valid player names. Invalid entries are automatically filtered out.`);
        }
        return;
      }
      
      // Don't filter out players if user explicitly entered them
      // The unwanted players filter should only apply to default/placeholder values,
      // not to user-entered data when starting a new draft
      // Clear old players and set new ones
      state.players = parsedPlayers;
      
      // Also clear any players that might be assigned to teams from previous drafts
      state.teams = state.teams.map(team => ({
        ...team,
        players: [] // Clear all team players when starting a new draft
      }));
      
      // Make sure snake draft state is properly set
      state.snakeDraft = document.getElementById('snakeDraft').checked;
      state.currentTurn = 0;
      state.draftOrder = this.generateDraftOrder();
      
      // Validate draft order was generated
      if (!state.draftOrder || state.draftOrder.length === 0) {
        showAlert('Error: Could not generate draft order. Please check your teams and players.');
        return;
      }
      
      state.isSettingOrder = false;

      // Hide setup sections
      document.querySelectorAll('.team-setup > div').forEach(div => {
        div.style.display = 'none';
      });

      document.querySelector('.draft-controls').style.display = 'block';
      document.getElementById('currentTurn').style.display = 'block';
      document.getElementById('draftInterface').style.display = 'block';

      save();
      render();
      } catch (error) {
        console.error('Error starting draft:', error);
        showAlert('An error occurred while starting the draft. Please try again.');
      }
    },

    generateDraftOrder() {
      // Safety check: ensure we have teams and players
      if (state.teams.length === 0 || state.players.length === 0) {
        return [];
      }
      
      const rounds = Math.ceil(state.players.length / state.teams.length);
      let order = [];

      for (let i = 0; i < rounds; i++) {
        const round = [...state.teams];
        if (state.snakeDraft && i % 2 === 1) {
          round.reverse();
        }
        order = order.concat(round);
      }
      return order;
    },

    pickPlayer,

    reset(showWarning = true) {
        // Always show confirmation dialog for New Draft
        const customAlert = document.getElementById('customAlert');
        const overlay = document.getElementById('alertOverlay');
        
        // Update alert content for confirmation
        customAlert.querySelector('.custom-alert-title').textContent = 'Start New Draft?';
        customAlert.querySelector('.custom-alert-content').textContent = 'This will reset all teams and players. This action cannot be undone.';
        
        // Update buttons for confirmation
        const buttonsContainer = customAlert.querySelector('.custom-alert-buttons');
        buttonsContainer.innerHTML = `
            <button class="custom-alert-cancel" onclick="DraftManager.closeAlert()">❌ Cancel</button>
            <button class="custom-alert-confirm" onclick="DraftManager.confirmReset()">⚽ Start New Draft</button>
        `;
        
        overlay.style.display = 'block';
        customAlert.style.display = 'block';
    },

    confirmReset() {
        document.getElementById('alertOverlay').style.display = 'none';
        document.getElementById('customAlert').style.display = 'none';

        // Clear localStorage
        localStorage.removeItem(KEY);
        localStorage.removeItem('draftData');
        localStorage.removeItem('instructionsCollapsed');

        // Reset state completely
        state = {
            teams: [],
            players: [],
            snakeDraft: false,
            currentTurn: 0,
            draftOrder: [],
            editingTeam: null,
            isSettingOrder: false
        };

        // Reset snake draft switch
        document.getElementById('snakeDraft').checked = false;
        
        // Clear the teams list
        const teamsList = document.querySelector('.teams-list');
        if (teamsList) {
            teamsList.innerHTML = '';
        }

        // Clear the players input container
        const tagsContainer = document.querySelector('.players-tags');
        if (tagsContainer) {
            tagsContainer.innerHTML = '';
        }
        
        // Reset container state and count
        const container = document.querySelector('.players-input-container');
        if (container) {
            container.classList.add('empty');
        }
        const countDisplay = document.querySelector('.players-count');
        if (countDisplay) {
            countDisplay.textContent = '0 players';
        }

        // Reset hidden players textarea
        const playersTextarea = document.getElementById('players');
        if (playersTextarea) {
            playersTextarea.value = '';
        }

        // Clear URL hash
        if (window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        
        // Reset UI sections
        document.getElementById('draftOrderSection').style.display = 'none';
        document.getElementById('draftInterface').style.display = 'none';
        document.getElementById('teamsList').style.display = 'none';
        document.getElementById('availablePlayers').innerHTML = '';
        document.getElementById('draftOrderList').innerHTML = '';

        // Show setup sections again
        document.querySelectorAll('.team-setup > div').forEach(div => {
            div.style.display = 'block';
        });

        document.querySelector('.draft-controls').style.display = 'block';
        document.getElementById('currentTurn').style.display = 'block';

        // Reset draft type text
        const typeText = document.getElementById('draftTypeText');
        const description = document.getElementById('draftDescription');
        if (typeText) typeText.textContent = 'Classic Draft';
        if (description) description.textContent = 'A→B→C, A→B→C';

        render();
    },

    closeAlert() {
      document.getElementById('customAlert').style.display = 'none';
      document.getElementById('alertOverlay').style.display = 'none';
    },

    editTeam(teamName) {
      const team = state.teams.find(t => t.name === teamName);
      if (!team) return;

      state.editingTeam = team;

      document.getElementById('editTeamName').value = team.name;
      document.getElementById('editTeamColor').value = team.color;

// Find matching color option if it exists
      const colorOption = document.querySelector(`#editModal .color-option[data-color="${team.color}"]`);
      if (colorOption) {
        DraftManager.selectColor(colorOption, 'editTeamColor');
      } else {
        // If no matching preset color, clear all selections
        document.querySelectorAll('#editModal .color-option').forEach(opt => {
          opt.classList.remove('selected');
        });
      }

      const editCaptainInput = document.getElementById('editCaptain');
      editCaptainInput.value = team.captain;
      
      // Make edit captain input droppable
      editCaptainInput.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        editCaptainInput.style.backgroundColor = '#e8f5e9';
      });
      
      editCaptainInput.addEventListener('dragleave', (e) => {
        editCaptainInput.style.backgroundColor = '';
      });
      
      editCaptainInput.addEventListener('drop', (e) => {
        e.preventDefault();
        const playerName = e.dataTransfer.getData('text/plain');
        if (playerName) {
          editCaptainInput.value = playerName;
          editCaptainInput.style.backgroundColor = '#c8e6c9';
          setTimeout(() => {
            editCaptainInput.style.backgroundColor = '';
          }, 500);
        }
      });

      const playersDiv = document.getElementById('editTeamPlayers');
      playersDiv.innerHTML = `
    <div class="team-player-item captain-item">
        <div class="player-info">
            <span>${team.captain} (C)</span>
        </div>
    </div>
    ${team.players.map(player => `
        <div class="team-player-item" data-player-id="${player.id}">
            <div class="player-info">
                <span>${player.name}</span>
            </div>
            <div class="player-actions">
                <button onclick="DraftManager.removePlayer('${player.id}', '${team.id}')" 
                        class="remove-player-button">
                    ✕
                </button>
            </div>
        </div>
    `).join('')}
`;

      document.getElementById('editModal').style.display = 'flex';
    },

    closeEditModal() {
      document.getElementById('editModal').style.display = 'none';
      state.editingTeam = null;
    },

    removePlayer(playerId, teamId) {
      const team = state.teams.find(t => t.id === teamId);
      if (!team) return;

      const player = team.players.find(p => p.id === playerId);
      if (player) {
        team.players = team.players.filter(p => p.id !== playerId);
        
        // Find and update the player in the main players array
        const mainPlayer = state.players.find(p => p.id === playerId);
        if (mainPlayer) {
          mainPlayer.teamId = null;
        }

        // Adjust currentTurn if needed
        const maxPlayersPerTeam = calculateMaxPlayersPerTeam(state);
        const removedFromTeamIndex = state.draftOrder.findIndex(t => t.id === teamId);
        
        // If the team we removed from now has fewer players than others,
        // and it's before the current turn, we need to adjust the turn
        if (team.players.length < maxPlayersPerTeam) {
          const currentTurnTeamIndex = state.currentTurn % state.draftOrder.length;
          if (removedFromTeamIndex <= currentTurnTeamIndex) {
            state.currentTurn = Math.max(0, state.currentTurn - 1);
          }
        }

        save();
        render();
      }
    },

    saveTeamEdit() {
      if (!state.editingTeam) return;

      const newName = document.getElementById('editTeamName').value;
      const newColor = document.getElementById('editTeamColor').value;
      const newCaptain = document.getElementById('editCaptain').value;

      if (!newName || !newCaptain) {
        alert('Please fill in team name and captain!');
        return;
      }

      state.editingTeam.name = newName;
      state.editingTeam.color = newColor;
      state.editingTeam.captain = newCaptain;
// Captain position is already updated through updatePlayerPosition

      save();
      DraftManager.closeEditModal();
      render();
    },

    downloadScreenshot() {
      const teamsList = document.getElementById('teamsList');
      const teamsGrid = teamsList.querySelector('.teams-grid');

      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.overflow = 'visible';
      document.body.appendChild(tempContainer);

      // Create background container with soccer field pattern
      const backgroundContainer = document.createElement('div');
      backgroundContainer.style.position = 'relative';
      backgroundContainer.style.background = `
        rgba(255, 255, 255, 0.9),
        linear-gradient(transparent 95%, rgba(76, 175, 80, 0.1) 100%),
        repeating-linear-gradient(
          90deg,
          transparent,
          transparent 49px,
          rgba(76, 175, 80, 0.1) 50px,
          rgba(76, 175, 80, 0.1) 100px
        ),
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 49px,
          rgba(76, 175, 80, 0.1) 50px,
          rgba(76, 175, 80, 0.1) 100px
        )
      `;
      backgroundContainer.style.backgroundSize = '100px 100px';
      backgroundContainer.style.padding = '20px';
      backgroundContainer.style.borderRadius = '16px';

      // Clone the teams grid exactly as it appears
      const gridClone = teamsGrid.cloneNode(true);
      backgroundContainer.appendChild(gridClone);
      tempContainer.appendChild(backgroundContainer);

      // Hide all edit buttons in the clone
      gridClone.querySelectorAll('.edit-button').forEach(button => {
        button.style.display = 'none';
      });

      // Configure html2canvas to capture the enhanced view
      html2canvas(backgroundContainer, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        ignoreElements: (element) => {
          return element.classList.contains('edit-button');
        }
      }).then(canvas => {
        // Clean up temporary container
        document.body.removeChild(tempContainer);

        // For mobile devices, try to use the share API if available
        if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          canvas.toBlob(async (blob) => {
            const file = new File([blob], 'soccer-draft-teams.png', {type: 'image/png'});
            try {
              await navigator.share({
                files: [file],
                title: 'Soccer Draft Teams',
              });
            } catch (err) {
              // Fallback to direct download if share fails
              const link = document.createElement('a');
              link.download = 'soccer-draft-teams.png';
              link.href = canvas.toDataURL('image/png', 1.0);
              link.click();
            }
          }, 'image/png', 1.0);
        } else {
          // Desktop behavior
          const link = document.createElement('a');
          link.download = 'soccer-draft-teams.png';
          link.href = canvas.toDataURL('image/png', 1.0);
          link.click();
        }
      }).catch(err => {
        console.error('Screenshot failed:', err);
        alert('Failed to save image. Please try again.');
        // Clean up temporary container in case of error
        if (document.body.contains(tempContainer)) {
          document.body.removeChild(tempContainer);
        }
      });
    },

    exportCSV() {
        // Create headers with team names
        let headers = state.teams.map(team => team.name);
        let csvContent = headers.join(',') + '\n';

        // Add captains row
        let captains = state.teams.map(team => team.captain + ' (C)');
        csvContent += captains.join(',') + '\n';

        // Get max number of players across all teams
        const maxPlayers = Math.max(...state.teams.map(team => team.players.length));

        // Add player rows
        for (let i = 0; i < maxPlayers; i++) {
            let row = state.teams.map(team => team.players[i] ? team.players[i].name : '');
            csvContent += row.join(',') + '\n';
        }

        // Create and trigger download
        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `draft-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    selectColor(element, targetId) {
// Remove selected class from all options in the same group
      element.closest('.color-options').querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
      });

// Add selected class to clicked option
      element.classList.add('selected');

// Update the color input
      const color = element.dataset.color;
      document.getElementById(targetId).value = color;
    },

    updateCustomColor(value, targetId) {
// Remove selected class from all preset colors when using custom color
      document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.remove('selected');
      });
      document.getElementById(targetId).value = value;
    },

    loadTestData() {
      // Reset state first
      state = {
        teams: [],
        players: [],
        snakeDraft: true,
        currentTurn: 0,
        draftOrder: [],
        editingTeam: null,
        isSettingOrder: false
      };

      const testPlayers = [
        "Jimmy", "Tour", "Sovannrith",
        "Borey", "Luiz", "Rotana",
        "Yaw", "Pich", "Khemrath",
        "Can", "Danny", "Sopha",
        "Duy", "Thong", "Davit",
        "Angkea", "Maan", "Michael",
        "Narath", "Montero", "Panha",
        "Ean", "Kino", "Sokha", "Ken", "Ajino", "Michael", "Son"
      ];

      // Clear localStorage to prevent state persistence
      localStorage.removeItem(KEY);

      // Rest of the existing loadTestData code...
      // Update the hidden textarea
      const textarea = document.getElementById('players');
      textarea.value = testPlayers.join(', ');

      // Find the players input container and clear existing tags
      const tagsContainer = document.querySelector('.players-tags');
      if (tagsContainer) {
        tagsContainer.innerHTML = '';
        
        // Add each player as a tag
        testPlayers.forEach(name => {
          const tag = document.createElement('div');
          tag.className = 'player-tag';
          tag.innerHTML = `
            <span>${name}</span>
            <span class="remove-tag">×</span>
          `;
          
          tag.querySelector('.remove-tag').addEventListener('click', () => {
            tag.remove();
            // Update textarea value after removal
            const remainingPlayers = Array.from(document.querySelectorAll('.player-tag span:not(.remove-tag)'))
              .map(span => span.textContent);
            textarea.value = remainingPlayers.join(', ');
            
            // Update empty state
            const container = document.querySelector('.players-input-container');
            container.classList.toggle('empty', remainingPlayers.length === 0);
            
            // Update player count
            const countDisplay = document.querySelector('.players-count');
            if (countDisplay) {
              countDisplay.textContent = `${remainingPlayers.length} player${remainingPlayers.length !== 1 ? 's' : ''}`;
            }
          });
          
          tagsContainer.appendChild(tag);
        });
        
        // Update container empty state
        const container = document.querySelector('.players-input-container');
        container.classList.remove('empty');
        
        // Update player count
        const countDisplay = document.querySelector('.players-count');
        if (countDisplay) {
          countDisplay.textContent = `${testPlayers.length} players`;
        }
      }

      // Rest of the test data loading...
      const teamConfigs = [
        {name: "White Team", color: "#ffffff", captain: "RaDa"},
        {name: "Blue Team", color: "#3182ce", captain: "Saoling"},
        {name: "Red Team", color: "#e53e3e", captain: "Bun"},
        {name: "Green Team", color: "#38a169", captain: "Dara"}
      ];

      teamConfigs.forEach((config) => {
        state.teams.push({
          id: crypto.randomUUID(),
          name: config.name,
          color: config.color,
          captain: config.captain,
          players: []
        });
      });
      
      // Update snake draft switch and text
      const snakeDraftSwitch = document.getElementById('snakeDraft');
      const typeText = document.getElementById('draftTypeText');
      const description = document.getElementById('draftDescription');
      
      snakeDraftSwitch.checked = true;
      typeText.textContent = 'Snake Draft';
      description.textContent = 'A→B→C, C→B→A';

      // Update draft order list
      const draftOrderList = document.getElementById('draftOrderList');
      draftOrderList.innerHTML = state.teams.map((team, index) => `
        <div class="draft-order-item" draggable="true" data-team-index="${index}">
            <span class="draft-order-handle">⋮⋮</span>
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${team.color}"></div>
                <span>${team.name}</span>
                <small style="color: #666;">(${team.captain})</small>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
                <div class="draft-order-buttons">
                    <button class="order-button" onclick="DraftManager.moveTeam(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="order-button" onclick="DraftManager.moveTeam(${index}, 'down')" ${index === state.teams.length - 1 ? 'disabled' : ''}>↓</button>
                </div>
                <button onclick="DraftManager.removeTeam('${team.id}')" class="remove-team-button">✕</button>
            </div>
        </div>
    `).join('');

    // Add drag and drop functionality
    const items = draftOrderList.querySelectorAll('.draft-order-item');
    items.forEach(item => {
      item.addEventListener('dragstart', handleDragStart);
      item.addEventListener('dragover', handleDragOver);
      item.addEventListener('drop', handleDrop);
      item.addEventListener('dragend', handleDragEnd);
    });

    document.getElementById('draftOrderSection').style.display = 'block';

    // Show teams grid
    const draftInterface = document.getElementById('draftInterface');
    draftInterface.style.display = 'block';
    const teamsGrid = draftInterface.querySelector('.teams-grid');
    teamsGrid.innerHTML = state.teams.map(team => renderTeam(team)).join('');

    save();
    render();
  },

  removeTeam(teamId) {
    state.teams = state.teams.filter(team => team.id !== teamId);

    if (state.teams.length === 0) {
      document.getElementById('draftOrderSection').style.display = 'none';
      document.getElementById('draftInterface').style.display = 'none';
    }

    // Update draft order list
    const draftOrderList = document.getElementById('draftOrderList');
    draftOrderList.innerHTML = state.teams.map((team, index) => `
      <div class="draft-order-item" draggable="true" data-team-index="${index}">
          <span class="draft-order-handle">⋮⋮</span>
          <div style="display: flex; align-items: center; gap: 8px;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background: ${team.color}"></div>
              <span>${team.name}</span>
              <small style="color: #666;">(${team.captain})</small>
          </div>
          <div style="display: flex; align-items: center; gap: 4px;">
              <div class="draft-order-buttons">
                  <button class="order-button" onclick="DraftManager.moveTeam(${index}, 'up')" ${index === 0 ? 'disabled' : ''}>↑</button>
                  <button class="order-button" onclick="DraftManager.moveTeam(${index}, 'down')" ${index === state.teams.length - 1 ? 'disabled' : ''}>↓</button>
              </div>
              <button onclick="DraftManager.removeTeam('${team.id}')" class="remove-team-button">✕</button>
          </div>
      </div>
  `).join('');

// Update teams grid
    const draftInterface = document.getElementById('draftInterface');
    const teamsGrid = draftInterface.querySelector('.teams-grid');
    teamsGrid.innerHTML = state.teams.map(team => renderTeam(team)).join('');

    save();
    render();
  },

  moveTeam,
  addTeamInput,
  removeTeamInput,
  saveTeams,
  copyShareLink
};
})();

window.addEventListener('load', () => {
  DraftManager.init();
  // Set current year if element exists
  const currentYearEl = document.getElementById('currentYear');
  if (currentYearEl) {
    currentYearEl.textContent = new Date().getFullYear();
  }
});

// Add this to your existing JavaScript
function triggerGoalAnimation() {
  const goalAnimation = document.querySelector('.goal-animation');
  goalAnimation.style.display = 'block';

  // Play a random celebration message
  const celebrations = [
    {text: "GOAL!", subtext: "What a fantastic shot! 🎯"},
    {text: "GOLAZO!", subtext: "Simply magnificent! ⭐"},
    {text: "GOAL!", subtext: "Top bins! ��"},
    {text: "SCORED!", subtext: "Clinical finish! ⚡"}
  ];

  const celebration = celebrations[Math.floor(Math.random() * celebrations.length)];
  goalAnimation.querySelector('.goal-text').textContent = celebration.text;
  goalAnimation.querySelector('.goal-subtext').textContent = celebration.subtext;

  // Add some confetti
  confetti({
    particleCount: 100,
    spread: 70,
    origin: {y: 0.6}
  });

  // Hide the animation after 2 seconds
  setTimeout(() => {
    goalAnimation.style.display = 'none';
  }, 2000);
}

// Update your existing celebrateDraftCompletion function
function celebrateDraftCompletion() {
  // Create celebration overlay with enhanced animation
  const overlay = document.createElement('div');
  overlay.className = 'celebration-overlay';
  overlay.innerHTML = `
        <div class="celebration-message">
            <h2>🏆 Draft Complete!</h2>
            <p>All players have been drafted successfully!</p>
            <div style="font-size: 2rem; margin-top: 15px;">⚽</div>
        </div>
    `;
  document.body.appendChild(overlay);

  // Enhanced confetti effect
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = {startVelocity: 30, spread: 360, ticks: 60, zIndex: 0};

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      setTimeout(() => {
        overlay.remove();
      }, 2000);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Confetti from multiple angles
    confetti({
      ...defaults,
      particleCount,
      origin: {x: randomInRange(0.1, 0.3), y: Math.random() - 0.2}
    });
    confetti({
      ...defaults,
      particleCount,
      origin: {x: randomInRange(0.7, 0.9), y: Math.random() - 0.2}
    });
  }, 250);

  // Trigger goal animation
  setTimeout(triggerGoalAnimation, 500);
}