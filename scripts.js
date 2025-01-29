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

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function parsePlayers(input) {
    return input
      .split(/,/)  // Split only by commas
      .map(p => p.trim())  // Remove whitespace
      .filter(p => p.length > 0)  // Remove empty entries
      .map(p => ({
        name: p,
        teamId: null,
        id: crypto.randomUUID()  // Add unique ID for each player
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
    const available = state.players.filter(p => !p.teamId);
    const isDraftComplete = available.length === 0;
    const isDraftStarted = state.draftOrder.length > 0;

    // Sort available players alphabetically
    available.sort((a, b) => a.name.localeCompare(b.name));

    // Hide setup sections if draft has started
    teamSetup.forEach(div => {
      div.style.display = isDraftStarted ? 'none' : 'block';
    });

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
                `;
      } else if (isDraftStarted) {
        draftInterface.style.display = 'block';
        document.getElementById('teamsList').style.display = 'none';

        const teamsGrid = draftInterface.querySelector('.teams-grid');
        teamsGrid.innerHTML = state.teams.map(team => renderTeam(team)).join('');

        const availableDiv = document.getElementById('availablePlayers');
        if (available.length > 0) {
          const currentTeam = state.draftOrder[state.currentTurn % state.draftOrder.length];
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
                                    <button class="danger-button" onclick="DraftManager.reset()">🔄 New Draft</button>
                                </div>
                            </div>
                            <div class="player-list">
                                ${available.map(p => `
                                    <div class="available-player" onclick="DraftManager.pickPlayer('${p.id}')">
                                        ${['⚽', '🥅', '🏃‍♂️', '⛳', '🎯', '🦶', '🥾', '🏆'][Math.floor(Math.random() * 8)]} ${p.name}
                                    </div>
                                `).join('')}
    </div>
</div>
                    `;
        } else {
          availableDiv.innerHTML = '';
        }
      }
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
                    <button onclick="DraftManager.editTeam('${team.name}')" class="edit-button" style="color: ${contrastColor}; border-color: ${contrastColor}">
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

    const currentTeam = state.draftOrder[state.currentTurn % state.draftOrder.length];
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

    // Remove the announcement after animation completes
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

  return {
    init() {
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
      
      // Add snake draft switch listener
      const snakeDraftSwitch = document.getElementById('snakeDraft');
      const typeText = document.getElementById('draftTypeText');
      const description = document.getElementById('draftDescription');

      // Set initial text based on saved state
      if (state.snakeDraft) {
          typeText.textContent = 'Snake Draft';
          description.textContent = 'A→B→C, C→B→A';
      } else {
          typeText.textContent = 'Classic Draft';
          description.textContent = 'A→B→C, A→B→C';
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
              state.draftOrder = DraftManager.generateDraftOrder();
          }
          
          save();
          render();
      });
      
      // Call updateDraftOrderText after a short delay to ensure DOM is ready
      setTimeout(updateDraftOrderText, 100);
      
      // Add resize listener for responsive text
      window.addEventListener('resize', updateDraftOrderText);
      
      render();
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

    startDraft() {
      if (state.teams.length < 2) {
        showAlert('Please add at least 2 teams!');
        return;
      }

      const playerInput = document.getElementById('players').value;
      if (!playerInput.trim()) {
        showAlert('Please enter some players!');
        return;
      }

      // Get the draft order from the current order in the list
      const draftOrderList = document.getElementById('draftOrderList');
      const orderedTeams = [...draftOrderList.children].map(item => {
        const index = parseInt(item.dataset.teamIndex);
        return state.teams[index];
      });

      // Update the teams array to match the new order
      state.teams = [...orderedTeams];
      state.players = parsePlayers(playerInput);
      
      // Make sure snake draft state is properly set
      state.snakeDraft = document.getElementById('snakeDraft').checked;
      state.currentTurn = 0;
      state.draftOrder = this.generateDraftOrder();
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
    },

    generateDraftOrder() {
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

        // Clear localStorage first
        localStorage.removeItem(KEY);

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

        // Reset snake draft text
        const typeText = document.getElementById('draftTypeText');
        const description = document.getElementById('draftDescription');
        typeText.textContent = 'Classic Draft';
        description.textContent = 'A→B→C, A→B→C';

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

      document.getElementById('editCaptain').value = team.captain;

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

      // Clone the teams grid
      const gridClone = teamsGrid.cloneNode(true);
      tempContainer.appendChild(gridClone);

      // Hide all edit buttons in the clone
      gridClone.querySelectorAll('.edit-button').forEach(button => {
        button.style.display = 'none';
      });

      // Center team names and adjust header styling
      gridClone.querySelectorAll('.team-header').forEach(header => {
        header.style.textAlign = 'center';
        header.style.padding = '8px 6px';

        // Remove flex styling from team-info to allow center alignment
        const teamInfo = header.querySelector('.team-info');
        if (teamInfo) {
          teamInfo.style.display = 'block';
          teamInfo.style.textAlign = 'center';
        }

        // Adjust team name and captain styling
        const teamName = header.querySelector('.team-name');
        if (teamName) {
          teamName.style.fontSize = '12px';
          teamName.style.fontWeight = '600';
          teamName.style.marginBottom = '2px';
        }
      });

      // Calculate base width per team (smaller to ensure fit)
      const teamsCount = state.teams.length;
      const baseWidth = 140; // Even smaller width
      const gap = 4; // Minimal gap
      const padding = 10; // Smaller padding

      // Calculate total width needed
      const totalWidth = (teamsCount * baseWidth) + ((teamsCount - 1) * gap) + (padding * 2);

      // Style the cloned grid
      gridClone.style.display = 'grid';
      gridClone.style.gridTemplateColumns = `repeat(${teamsCount}, ${baseWidth}px)`;
      gridClone.style.gap = `${gap}px`;
      gridClone.style.padding = `${padding}px`;
      gridClone.style.background = '#ffffff';
      gridClone.style.width = `${totalWidth}px`;
      gridClone.style.boxSizing = 'border-box';

      // Style each team column
      const teamCols = gridClone.querySelectorAll('.team-col');
      teamCols.forEach(col => {
        col.style.width = `${baseWidth}px`;
        col.style.minWidth = `${baseWidth}px`;
        col.style.maxWidth = `${baseWidth}px`;
        col.style.margin = '0';
        col.style.fontSize = '9px';
        col.style.boxSizing = 'border-box';

        // Style team header
        const header = col.querySelector('.team-header');
        if (header) {
          header.style.padding = '4px';
          header.style.marginBottom = '4px';
        }

        // Style player count
        const playerCount = col.querySelector('.player-count');
        if (playerCount) {
          playerCount.style.fontSize = '8px';
          playerCount.style.margin = '1px 0';
          playerCount.style.padding = '1px 0';
          playerCount.style.borderBottom = '1px solid #eee';
        }

        // Style team players
        const playersList = col.querySelector('.team-players');
        if (playersList) {
          playersList.style.gap = '0'; // Remove gap between players
          playersList.style.padding = '0';
          playersList.style.lineHeight = '1'; // Reduce line height

          // Style individual players
          const players = playersList.querySelectorAll('.team-player');
          players.forEach(player => {
            player.style.padding = '0px';
            player.style.fontSize = '8px';
            player.style.background = 'none';
            player.style.border = 'none';
            player.style.lineHeight = '1.1'; // Minimal line height
            player.style.height = 'auto';
            player.style.minHeight = '0';

            // Remove any hover effects or transitions
            player.style.transition = 'none';
            player.style.borderRadius = '0';
            player.style.margin = '0';

            // Style the player name container
            const playerName = player.querySelector('.team-player-name');
            if (playerName) {
              playerName.style.gap = '0';
              playerName.style.lineHeight = '1.1';
              playerName.style.padding = '0';
              playerName.style.margin = '0';
            }
          });
        }
      });

      // Let height be determined by content
      const maxHeight = Math.max(...Array.from(teamCols).map(col => col.offsetHeight)) + (padding * 2);

      // Configure html2canvas with higher scale for better quality
      html2canvas(gridClone, {
        backgroundColor: '#ffffff',
        scale: 3, // Increased scale for higher quality
        useCORS: true,
        allowTaint: true,
        width: totalWidth,
        height: maxHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: totalWidth,
        windowHeight: maxHeight,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.teams-grid');
          clonedElement.style.width = `${totalWidth}px`;
          clonedElement.style.height = `${maxHeight}px`;
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
// Create headers with team names (without empty first column)
      let headers = state.teams.map(team => `${team.name} (${team.captain})`);
      let csvContent = headers.join(',') + '\n';

// Get max number of players across all teams
      const maxPlayers = Math.max(...state.teams.map(team => team.players.length));

// Add player rows (without empty first column)
      for (let i = 0; i < maxPlayers; i++) {
        let row = state.teams.map(team => team.players[i] ? team.players[i].name : '');
        csvContent += row.join(',') + '\n';
      }

// Create and trigger download
      const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'soccer-draft-teams.csv');
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
      localStorage.removeItem(KEY);
      state = {
        teams: [],
        players: [],
        snakeDraft: true, // Set default to true for test data
        currentTurn: 0,
        draftOrder: [],
        editingTeam: null,
        isSettingOrder: false
      };

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

      document.getElementById('players').value = testPlayers.join(', ');
      document.getElementById('snakeDraft').checked = true; // Check the snake draft checkbox

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

    moveTeam
  };
})();

window.addEventListener('load', () => DraftManager.init());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => console.log('ServiceWorker registered'))
      .catch(err => console.log('ServiceWorker registration failed:', err));
  });
}

document.getElementById('currentYear').textContent = new Date().getFullYear();

// Add this to your existing JavaScript
function triggerGoalAnimation() {
  const goalAnimation = document.querySelector('.goal-animation');
  goalAnimation.style.display = 'block';

  // Play a random celebration message
  const celebrations = [
    {text: "GOAL!", subtext: "What a fantastic shot! 🎯"},
    {text: "GOLAZO!", subtext: "Simply magnificent! ⭐"},
    {text: "GOAL!", subtext: "Top bins! 🎯"},
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