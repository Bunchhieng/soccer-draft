const FORMATION_POSITIONS = {
  '4-4-2': {
    positions: [
      {x: 50.0, y: 85.0},  // GK
      {x: 20.0, y: 70.0},  // RB
      {x: 40.0, y: 70.0},  // RCB
      {x: 60.0, y: 70.0},  // LCB
      {x: 80.0, y: 70.0},  // LB
      {x: 25.0, y: 50.0},  // RM
      {x: 50.0, y: 50.0},  // CM
      {x: 75.0, y: 50.0},  // CM
      {x: 50.0, y: 30.0},  // RF
      {x: 30.0, y: 30.0},  // CF
      {x: 70.0, y: 30.0}   // LF
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '4-3-3': {
    positions: [
      {x: 50, y: 85},  // GK
      {x: 20, y: 70},  // RB
      {x: 40, y: 70},  // RCB
      {x: 60, y: 70},  // LCB
      {x: 80, y: 70},  // LB
      {x: 35, y: 50},  // RM
      {x: 50, y: 50},  // CM
      {x: 65, y: 50},  // CM
      {x: 30, y: 30},  // RF
      {x: 50, y: 30},  // CF
      {x: 70, y: 30}   // LF
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '3-5-2': {
    positions: [
      {x: 50, y: 85},  // GK
      {x: 30, y: 70},  // RCB
      {x: 50, y: 70},  // CB
      {x: 70, y: 70},  // LCB
      {x: 20, y: 50},  // RM
      {x: 40, y: 50},  // CM
      {x: 60, y: 50},  // CM
      {x: 80, y: 50},  // LM
      {x: 50, y: 50},  // CAM
      {x: 40, y: 30},  // CF
      {x: 60, y: 30}   // CF
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '4-2-3-1': {
    positions: [
      {x: 50, y: 85},  // GK
      {x: 20, y: 70},  // RB
      {x: 40, y: 70},  // RCB
      {x: 60, y: 70},  // LCB
      {x: 80, y: 70},  // LB
      {x: 35, y: 55},  // CDM
      {x: 65, y: 55},  // CDM
      {x: 25, y: 40},  // RM
      {x: 50, y: 40},  // CAM
      {x: 75, y: 40},  // LM
      {x: 50, y: 25}   // CF
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '3-4-3': {
    positions: [
      {x: 50, y: 85},  // GK
      {x: 30, y: 70},  // RCB
      {x: 50, y: 70},  // CB
      {x: 70, y: 70},  // LCB
      {x: 20, y: 50},  // RWB
      {x: 80, y: 50},  // LWB
      {x: 40, y: 50},  // RM
      {x: 60, y: 50},  // LM
      {x: 30, y: 30},  // RW
      {x: 50, y: 30},  // CF
      {x: 70, y: 30}   // LW
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '5-3-2': {
    positions: [
      {x: 50, y: 85},  // GK
      {x: 15, y: 70},  // RWB
      {x: 30, y: 70},  // RCB
      {x: 50, y: 70},  // CB
      {x: 70, y: 70},  // LCB
      {x: 85, y: 70},  // LWB
      {x: 35, y: 50},  // CM
      {x: 50, y: 50},  // CM
      {x: 65, y: 50},  // CM
      {x: 40, y: 30},  // CF
      {x: 60, y: 30}   // CF
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
};

const DRAW_TOOLS = {
  PENCIL: 'pencil',
  ARROW: 'arrow',
  ERASER: 'eraser'
};

class LineupBuilder {
  constructor() {
    this.players = [];
    this.currentPlayer = null;
    this.isDragging = false;
    this.state = {
      playerCount: 11,
      formation: '4-4-2',
      jerseyColor: '#ff0000',
      textColor: '#ffffff',
      lineupName: '',
      playerPositions: []
    };
    this.drawingMode = false;
    this.currentTool = DRAW_TOOLS.PENCIL;
    this.currentColor = '#000000';
    this.drawingHistory = [];
    this.isDrawing = false;
    this.startPoint = null;
    this.drawnElements = [];
    this.currentArrow = null;
    this.init();
  }

  init() {
    this.loadState();
    this.setupEventListeners();
    this.createSVGContainer();
    
    // Set initial values from state
    document.getElementById('player-count').value = this.state.playerCount;
    document.getElementById('formation').value = this.state.formation;
    document.getElementById('jersey-color').value = this.state.jerseyColor;
    document.getElementById('text-color').value = this.state.textColor;
    document.getElementById('lineup-name').value = this.state.lineupName;
    
    this.generatePlayers(this.state.playerCount);
    this.updateJerseyColors();
    this.restorePlayerPositions();
    this.setupDrawingTools();
  }

  saveState() {
    // Save current state to localStorage
    this.state.playerCount = parseInt(document.getElementById('player-count').value);
    this.state.formation = document.getElementById('formation').value;
    this.state.jerseyColor = document.getElementById('jersey-color').value;
    this.state.textColor = document.getElementById('text-color').value;
    this.state.lineupName = document.getElementById('lineup-name').value;
    
    // Save player positions
    this.state.playerPositions = this.players.map(player => ({
      left: player.style.left,
      top: player.style.top,
      number: player.querySelector('.player-number').textContent,
      name: player.querySelector('.player-name').textContent
    }));
    
    localStorage.setItem('lineupState', JSON.stringify(this.state));
  }

  loadState() {
    const savedState = localStorage.getItem('lineupState');
    if (savedState) {
      this.state = JSON.parse(savedState);
    } else {
      // Default to 8 players on mobile
      const isMobile = window.matchMedia('(max-width: 768px)').matches;
      this.state.playerCount = isMobile ? 8 : 11;
    }
  }

  restorePlayerPositions() {
    if (this.state.playerPositions.length > 0) {
      this.players.forEach((player, index) => {
        const position = this.state.playerPositions[index];
        if (position) {
          player.style.left = position.left;
          player.style.top = position.top;
          player.querySelector('.player-number').textContent = position.number;
          player.querySelector('.player-name').textContent = position.name;
        }
      });
    }
  }

  setupEventListeners() {
    // Player count change
    document.getElementById('player-count').addEventListener('change', (e) => {
      const count = parseInt(e.target.value);
      this.generatePlayers(count);
      this.saveState();
    });

    // Handle save button - only one listener needed
    const saveButton = document.getElementById('save-image');
    saveButton.removeEventListener('click', this.saveAsImage.bind(this)); // Remove existing listener
    saveButton.addEventListener('click', this.saveAsImage.bind(this));

    // Jersey color change
    const jerseyColorInput = document.getElementById('jersey-color');
    jerseyColorInput.addEventListener('input', () => {
      this.updateJerseyColors();
      this.saveState();
    });

    // Text color change
    const textColorInput = document.getElementById('text-color');
    textColorInput.addEventListener('input', () => {
      this.updateJerseyColors();
      this.saveState();
    });

    // Formation change
    document.getElementById('formation').addEventListener('change', () => {
      const count = parseInt(document.getElementById('player-count').value);
      this.generatePlayers(count);
      this.saveState();
    });

    // Lineup name change
    document.getElementById('lineup-name').addEventListener('input', (e) => {
      const title = document.getElementById('field-title');
      title.textContent = e.target.value;
      this.saveState();
    });

    document.querySelector('.toggle-settings').addEventListener('click', () => {
      const panel = document.querySelector('.settings-panel');
      panel.classList.toggle('expanded');
    });

    // Add menu toggle functionality
    const menuButton = document.getElementById('menu-button');
    const menu = document.getElementById('menu');

    menuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !menuButton.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    // Add current year to menu
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // Add save state when players are moved
    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.saveState();
      }
    });

    document.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.saveState();
      }
    });

    // Reset lineup
    document.getElementById('reset-lineup').addEventListener('click', () => {
        this.resetLineup();
    });

    // Update the toggle drawing event listener
    document.getElementById('toggle-drawing').addEventListener('click', () => {
      this.drawingMode = !this.drawingMode;
      const button = document.getElementById('toggle-drawing');
      button.classList.toggle('active', this.drawingMode);
      const field = document.querySelector('.soccer-field');
      field.style.cursor = this.drawingMode ? 'crosshair' : 'default';
      
      // Show/hide drawing tools
      const drawingTools = document.querySelector('.drawing-tools');
      if (drawingTools) {
        drawingTools.style.display = this.drawingMode ? 'flex' : 'none';
        
        // Reset position on mobile
        if (window.matchMedia('(max-width: 768px)').matches) {
          drawingTools.style.left = '20px';
          drawingTools.style.bottom = '150px';
          drawingTools.style.transform = 'none';
        }
      }
    });
  }

  generatePlayers(count) {
    const container = document.querySelector('.players-container');
    container.innerHTML = '';
    this.players = [];

    const formation = document.getElementById('formation').value;
    const formationData = FORMATION_POSITIONS[formation];
    const positions = formationData.priority
      .slice(0, count)
      .map(index => formationData.positions[index]);

    const scaleFactor = count < 11 ? 0.8 + (count / 11 * 0.2) : 1;

    for (let i = 0; i < count; i++) {
      const player = document.createElement('div');
      player.classList.add('player');

      // Add jersey icon
      const jerseyIcon = document.createElement('i');
      jerseyIcon.className = 'fa-solid fa-shirt';
      jerseyIcon.style.color = '#001f3f';
      jerseyIcon.style.fontSize = '4rem';
      jerseyIcon.style.position = 'absolute';
      jerseyIcon.style.zIndex = '1';
      player.appendChild(jerseyIcon);

      // Add number
      const numberElement = document.createElement('div');
      numberElement.className = 'player-number';
      numberElement.textContent = i + 1;
      numberElement.style.position = 'absolute';
      numberElement.style.zIndex = '2';
      numberElement.style.color = 'white';
      numberElement.style.fontSize = '1.5rem';
      numberElement.style.fontWeight = 'bold';
      numberElement.style.marginTop = '0.2rem';
      player.appendChild(numberElement);

      // Add name
      const nameElement = document.createElement('div');
      nameElement.className = 'player-name';
      
      // Restore name from state if available
      const savedName = this.state.playerPositions[i]?.name || 'Click to edit';
      nameElement.textContent = savedName;
      
      nameElement.contentEditable = true;
      nameElement.style.position = 'absolute';
      nameElement.style.top = '100%';
      nameElement.style.width = '100%';
      nameElement.style.textAlign = 'center';
      nameElement.style.color = 'white';
      nameElement.style.fontSize = '1rem';
      nameElement.style.minWidth = '100px';
      player.appendChild(nameElement);

      const {x, y} = positions[i];
      const centeredX = 50 + (x - 50) * scaleFactor;
      const centeredY = 50 + (y - 50) * scaleFactor;

      player.style.left = `${centeredX}%`;
      player.style.top = `${centeredY}%`;

      // Add event listeners
      player.addEventListener('touchstart', this.handleTouchStart.bind(this));
      player.addEventListener('touchmove', this.handleTouchMove.bind(this));
      player.addEventListener('touchend', this.handleTouchEnd.bind(this));
      player.addEventListener('mousedown', this.handleMouseDown.bind(this));

      // Add edit event listeners
      this.handleEdit(nameElement);

      // Add text selection listeners
      nameElement.addEventListener('touchstart', this.handleTextSelection.bind(this));

      container.appendChild(player);
      this.players.push(player);
    }
    this.updateJerseyColors();
  }

  handleMouseDown(e) {
    if (!e.target.classList.contains('player')) return;

    e.preventDefault();
    this.isDragging = true;
    const player = e.target;
    player.style.zIndex = 1000;

    // Remove transition during drag
    player.style.transition = 'none';
    player.style.transform = 'translate(-50%, -50%)';

    // Store initial click position and player position
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.initialLeft = parseFloat(player.style.left);
    this.initialTop = parseFloat(player.style.top);

    const moveHandler = (moveEvent) => {
      if (this.isDragging) {
        const fieldLines = document.querySelector('.field-lines');
        const fieldRect = fieldLines.getBoundingClientRect();

        // Calculate movement delta with higher precision
        const deltaX = ((moveEvent.clientX - this.startX) / fieldRect.width * 10000).toFixed(2) / 100;
        const deltaY = ((moveEvent.clientY - this.startY) / fieldRect.height * 10000).toFixed(2) / 100;

        // Calculate new position with higher precision
        const newX = (this.initialLeft + deltaX).toFixed(2);
        const newY = (this.initialTop + deltaY).toFixed(2);

        // Constrain within field boundaries
        const constrainedX = Math.max(0, Math.min(100 - 8, newX));
        const constrainedY = Math.max(0, Math.min(100 - 8, newY));

        player.style.left = `${constrainedX}%`;
        player.style.top = `${constrainedY}%`;
      }
    };

    const upHandler = () => {
      this.isDragging = false;
      player.style.zIndex = '';

      // Reset transition after drag
      player.style.transition = 'z-index 0.2s ease';
      player.style.transform = 'translate(-50%, -50%)';

      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }

  handleTouchStart(e) {
    // Check if we're touching an editable element
    const editableElement = e.target.closest('[contenteditable]');
    if (editableElement) {
      editableElement.contentEditable = true;
      editableElement.focus();
      return;
    }

    // Handle dragging
    e.preventDefault();
    this.isDragging = true;
    const player = e.target.closest('.player');
    if (!player) return;

    player.style.zIndex = 1000;
    player.style.transition = 'none';
    this.currentPlayer = player;
  }

  handleTouchMove(e) {
    if (this.isDragging && this.currentPlayer) {
      e.preventDefault();
      const touch = e.touches[0];
      const container = document.querySelector('.players-container');
      const fieldLines = document.querySelector('.field-lines');
      const fieldRect = fieldLines.getBoundingClientRect();

      // Calculate position with more precision
      const x = ((touch.clientX - fieldRect.left) / fieldRect.width * 1000).toFixed(0) / 10;
      const y = ((touch.clientY - fieldRect.top) / fieldRect.height * 1000).toFixed(0) / 10;

      const constrainedX = Math.max(0, Math.min(100 - 8, x));
      const constrainedY = Math.max(0, Math.min(100 - 8, y));

      this.currentPlayer.style.left = `${constrainedX}%`;
      this.currentPlayer.style.top = `${constrainedY}%`;
    }
  }

  handleTouchEnd() {
    if (this.isDragging && this.currentPlayer) {
      this.isDragging = false;
      this.currentPlayer.style.zIndex = '';
      this.currentPlayer.style.transition = 'all 0.2s ease';
      this.currentPlayer = null;
    }
  }

  openPlayerModal(player) {
    this.currentPlayer = player;
    document.getElementById('player-number').value = player.textContent;
    document.getElementById('player-name').value = player.dataset.name || '';
    document.getElementById('player-modal').style.display = 'block';
  }

  savePlayerChanges() {
    const number = document.getElementById('player-number').value;
    const name = document.getElementById('player-name').value;

    if (this.currentPlayer) {
      this.currentPlayer.textContent = number;
      this.currentPlayer.dataset.name = name;

      // Add name display if name exists
      if (name) {
        const nameElement = document.createElement('div');
        nameElement.className = 'player-name';
        nameElement.textContent = name;
        this.currentPlayer.appendChild(nameElement);
      }
    }
    this.closeModal();
  }

  closeModal() {
    document.getElementById('player-modal').style.display = 'none';
    this.currentPlayer = null;
  }

  updateJerseyColors() {
    const jerseyColor = document.getElementById('jersey-color').value;
    const textColor = document.getElementById('text-color').value;

    this.players.forEach(player => {
      // Update jersey color
      const jerseyIcon = player.querySelector('.fa-shirt');
      if (jerseyIcon) {
        jerseyIcon.style.color = jerseyColor;
      }

      // Update number color only
      const numberElement = player.querySelector('.player-number');
      if (numberElement) {
        numberElement.style.color = textColor;
      }
    });
  }

  saveAsImage() {
    const field = document.querySelector('.soccer-field');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Temporarily adjust styles for capture
    const originalOverflow = field.style.overflow;
    const originalWidth = field.style.width;
    const originalHeight = field.style.height;

    field.style.overflow = 'visible';
    field.style.width = '100%';
    field.style.height = 'auto';

    // Adjust scale and dimensions for mobile
    const scale = isMobile ? 1.5 : 2;
    const canvasWidth = isMobile ? field.offsetWidth * 1.2 : field.scrollWidth;
    const canvasHeight = isMobile ? field.offsetHeight * 1.2 : field.scrollHeight;

    html2canvas(field, {
      useCORS: true,
      logging: true,
      scale: scale,
      backgroundColor: null,
      scrollX: 0,
      scrollY: 0,
      windowWidth: canvasWidth,
      windowHeight: canvasHeight,
      onclone: (clonedDoc) => {
        const clonedField = clonedDoc.querySelector('.soccer-field');
        clonedField.style.overflow = 'visible';
        clonedField.style.width = '100%';
        clonedField.style.height = 'auto';
        
        // Adjust field size for mobile in cloned document
        if (isMobile) {
          clonedField.style.transform = 'scale(0.8)';
          clonedField.style.transformOrigin = 'top left';
        }
      }
    }).then(canvas => {
      // Restore original styles
      field.style.overflow = originalOverflow;
      field.style.width = originalWidth;
      field.style.height = originalHeight;

      // Create and trigger download
      const link = document.createElement('a');
      link.download = 'lineup.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }).catch(err => {
      console.error('Error generating image:', err);
      // Restore original styles in case of error
      field.style.overflow = originalOverflow;
      field.style.width = originalWidth;
      field.style.height = originalHeight;
    });
  }

  // Add this new method to handle text selection
  handleTextSelection(e) {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      e.stopPropagation();
    }
  }

  handleEdit(element) {
    let isTouchDevice = 'ontouchstart' in window;

    const handleFocus = (e) => {
      e.preventDefault();
      element.contentEditable = true;
      if (element.textContent.trim() === 'Click to edit') {
        element.textContent = '';
      }
      element.focus();
    };

    const handleBlur = () => {
      if (element.textContent.trim() === '') {
        element.textContent = 'Click to edit';
      }
      this.saveState(); // Save state when name is edited
    };

    if (isTouchDevice) {
      element.addEventListener('touchstart', handleFocus, {passive: false});
      element.removeEventListener('mousedown', handleFocus);
    } else {
      element.addEventListener('mousedown', handleFocus);
      element.removeEventListener('touchstart', handleFocus);
    }

    element.addEventListener('blur', handleBlur);
    element.addEventListener('input', () => this.saveState()); // Save state on input
  }

  resetLineup() {
    // Clear localStorage
    localStorage.removeItem('lineupState');
    
    // Reset state to default values
    this.state = {
      playerCount: window.matchMedia('(max-width: 768px)').matches ? 8 : 11,
      formation: '4-4-2',
      jerseyColor: '#ff0000',
      textColor: '#ffffff',
      lineupName: '',
      playerPositions: []
    };
    
    // Update UI elements
    document.getElementById('player-count').value = this.state.playerCount;
    document.getElementById('formation').value = this.state.formation;
    document.getElementById('jersey-color').value = this.state.jerseyColor;
    document.getElementById('text-color').value = this.state.textColor;
    document.getElementById('lineup-name').value = this.state.lineupName;
    
    // Regenerate players
    this.generatePlayers(this.state.playerCount);
    this.updateJerseyColors();
    
    // Clear field title
    document.getElementById('field-title').textContent = '';
  }

  setupDrawingTools() {
    // Create drawing tools container
    const toolsContainer = document.createElement('div');
    toolsContainer.className = 'drawing-tools';
    toolsContainer.innerHTML = `
      <div class="drawing-tools-header">
        <button class="close-drawing-tools">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="drawing-tools-body">
              <input type="color" class="drawing-color" value="#000000">
        <button class="drawing-tool" data-tool="pencil">
          <i class="fas fa-pencil-alt"></i>
        </button>
        <button class="drawing-tool" data-tool="arrow">
          <i class="fas fa-arrow-right"></i>
        </button>
        <button class="drawing-tool" data-tool="eraser">
          <i class="fas fa-eraser"></i>
        </button>
            <button class="drawing-undo" title="Undo last action">
          <i class="fas fa-undo"></i>
        </button>
        <button class="drawing-clear">Clear</button>
      </div>
    `;
    document.body.appendChild(toolsContainer);

    // Add drag functionality
    let isDragging = false;
    let offsetX, offsetY;

    toolsContainer.querySelector('.drawing-tools-header').addEventListener('mousedown', (e) => {
      isDragging = true;
      offsetX = e.clientX - toolsContainer.offsetLeft;
      offsetY = e.clientY - toolsContainer.offsetTop;
      toolsContainer.style.width = `${toolsContainer.offsetWidth}px`;
      toolsContainer.style.height = `${toolsContainer.offsetHeight}px`;
      e.preventDefault();
    });

    // Add touchstart event listener for dragging
    toolsContainer.querySelector('.drawing-tools-header').addEventListener('touchstart', (e) => {
      isDragging = true;
      const touch = e.touches[0];
      offsetX = touch.clientX - toolsContainer.offsetLeft;
      offsetY = touch.clientY - toolsContainer.offsetTop;
      toolsContainer.style.width = `${toolsContainer.offsetWidth}px`;
      toolsContainer.style.height = `${toolsContainer.offsetHeight}px`;
      e.preventDefault();
    });

    // Update the event listeners to handle both mouse and touch
    const handleMove = (e) => {
      if (isDragging) {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const x = clientX - offsetX;
        const y = clientY - offsetY;
        
        // Constrain to window boundaries with mobile-specific adjustments
        const maxX = window.innerWidth - toolsContainer.offsetWidth;
        const maxY = window.innerHeight - toolsContainer.offsetHeight;
        
        // Add minimum left position for mobile
        const minX = 0;
        const minY = 0;
        
        // Calculate new position with constraints
        const newX = Math.max(minX, Math.min(x, maxX));
        const newY = Math.max(minY, Math.min(y, maxY));
        
        // Apply position with smooth transition
        toolsContainer.style.transition = 'none';
        toolsContainer.style.left = `${newX}px`;
        toolsContainer.style.top = `${newY}px`;
        e.preventDefault();
      }
    };

    const handleEnd = () => {
      isDragging = false;
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchend', handleEnd);

    // Update the close button functionality
    const closeButton = toolsContainer.querySelector('.close-drawing-tools');
    closeButton.addEventListener('click', handleClose);
    closeButton.addEventListener('touchend', handleClose);

    function handleClose(e) {
      e.preventDefault();
      this.drawingMode = false;
      toolsContainer.style.display = 'none';
      const field = document.querySelector('.soccer-field');
      field.style.cursor = 'default';
      document.getElementById('toggle-drawing').classList.remove('active');
      
      // Reset position on mobile
      if (window.matchMedia('(max-width: 768px)').matches) {
        toolsContainer.style.left = '20px';
        toolsContainer.style.bottom = '150px';
        toolsContainer.style.transform = 'none';
      }
    }

    // Add event listeners for drawing tools
    toolsContainer.querySelectorAll('.drawing-tool').forEach(button => {
      button.addEventListener('click', (e) => {
        this.currentTool = e.currentTarget.dataset.tool;
        toolsContainer.querySelectorAll('.drawing-tool').forEach(btn => 
          btn.classList.remove('active')
        );
        e.currentTarget.classList.add('active');
        
        // Update cursor based on selected tool
        const field = document.querySelector('.soccer-field');
        switch (this.currentTool) {
          case DRAW_TOOLS.PENCIL:
            field.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path d=\'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z\'/></svg>") 0 24, auto';
            break;
          case DRAW_TOOLS.ARROW:
            field.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path fill=\'${this.currentColor}\' d=\'M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z\'/></svg>") 12 12, auto';
            break;
          case DRAW_TOOLS.ERASER:
            field.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'><path d=\'M16.24 3.56l4.95 4.94c.78.79.78 2.05 0 2.84L12 20.41l-7.19-7.19L16.24 3.56M10.83 8.5l-1.41 1.41 3.54 3.54-1.41 1.41-3.54-3.54-3.54 3.54-1.41-1.41 3.54-3.54L3.05 7.05l1.41-1.41L10.83 8.5z\'/></svg>") 12 12, auto';
            break;
        }
      });
    });

    // Color picker
    const colorPicker = toolsContainer.querySelector('.drawing-color');
    colorPicker.addEventListener('input', (e) => {
      this.currentColor = e.target.value;
      
      // Update cursor color for pencil tool
      if (this.currentTool === DRAW_TOOLS.PENCIL) {
        const field = document.querySelector('.soccer-field');
        field.style.cursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='${this.currentColor}' d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'/></svg>") 0 24, auto`;
      }
    });

    // Clear button
    toolsContainer.querySelector('.drawing-clear').addEventListener('click', () => {
      this.clearDrawings();
    });

    // Add undo functionality
    toolsContainer.querySelector('.drawing-undo').addEventListener('click', () => {
      this.undoLastAction();
    });

    // Add drawing event listeners to the field
    const field = document.querySelector('.soccer-field');
    field.addEventListener('mousedown', this.startDrawing.bind(this));
    field.addEventListener('mousemove', this.draw.bind(this));
    field.addEventListener('mouseup', this.stopDrawing.bind(this));
    field.addEventListener('mouseleave', this.stopDrawing.bind(this));

    field.addEventListener('touchstart', this.startDrawing.bind(this));
    field.addEventListener('touchmove', this.draw.bind(this));
    field.addEventListener('touchend', this.stopDrawing.bind(this));
  }

  startDrawing(e) {
    if (!this.drawingMode) return;
    e.preventDefault();
    this.isDrawing = true;
    const point = this.getCoordinates(e);
    this.startPoint = point;

    if (this.currentTool === DRAW_TOOLS.PENCIL) {
      this.drawnElements.push(this.createPath(point));
    }
  }

  draw(e) {
    if (!this.isDrawing || !this.drawingMode) return;
    e.preventDefault();
    const point = this.getCoordinates(e);

    switch (this.currentTool) {
      case DRAW_TOOLS.PENCIL:
        this.drawPencil(point);
        break;
      case DRAW_TOOLS.ARROW:
        this.drawArrow(point);
        break;
    }
  }

  stopDrawing() {
    if (!this.drawingMode) return;
    this.isDrawing = false;
    this.currentArrow = null;
    this.startPoint = null;
  }

  drawPencil(point) {
    const path = this.drawnElements[this.drawnElements.length - 1];
    path.points.push(point);
    this.updatePath(path);
  }

  drawArrow(point) {
    // Only create a new arrow when we start drawing
    if (!this.currentArrow) {
      this.currentArrow = this.createArrow(this.startPoint, point);
      this.drawnElements.push(this.currentArrow);
    } else {
      // Update the existing arrow while drawing
      this.updateArrow(this.currentArrow, this.startPoint, point);
    }
  }

  updateArrow(arrow, startPoint, endPoint) {
    const line = arrow.querySelector('line');
    const arrowhead = arrow.querySelector('polygon');
    
    // Update line coordinates
    line.setAttribute('x1', startPoint.x);
    line.setAttribute('y1', startPoint.y);
    line.setAttribute('x2', endPoint.x);
    line.setAttribute('y2', endPoint.y);
    
    // Update arrowhead coordinates
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    const arrowSize = 10;
    const arrowPoints = [
      { x: endPoint.x, y: endPoint.y },
      { 
        x: endPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
        y: endPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
      },
      { 
        x: endPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
        y: endPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
      }
    ];
    
    arrowhead.setAttribute('points', arrowPoints.map(p => `${p.x},${p.y}`).join(' '));
  }

  createPath(startPoint) {
    const svg = document.querySelector('.soccer-field svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('stroke', this.currentColor);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.points = [startPoint];
    svg.appendChild(path);
    return path;
  }

  createArrow(startPoint, endPoint) {
    const svg = document.querySelector('.soccer-field svg');
    const svgNS = 'http://www.w3.org/2000/svg';
    const group = document.createElementNS(svgNS, 'g');
    
    // Line
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', startPoint.x);
    line.setAttribute('y1', startPoint.y);
    line.setAttribute('x2', endPoint.x);
    line.setAttribute('y2', endPoint.y);
    line.setAttribute('stroke', this.currentColor);
    line.setAttribute('stroke-width', '2');
    
    // Arrowhead
    const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
    const arrowSize = 10;
    const arrowPoints = [
      { x: endPoint.x, y: endPoint.y },
      { 
        x: endPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
        y: endPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
      },
      { 
        x: endPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
        y: endPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
      }
    ];
    
    const arrowhead = document.createElementNS(svgNS, 'polygon');
    arrowhead.setAttribute('points', arrowPoints.map(p => `${p.x},${p.y}`).join(' '));
    arrowhead.setAttribute('fill', this.currentColor);
    
    group.appendChild(line);
    group.appendChild(arrowhead);
    svg.appendChild(group);
    return group;
  }

  updatePath(path) {
    const d = path.points.map((p, i) => 
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');
    path.setAttribute('d', d);
  }

  getCoordinates(e) {
    const field = document.querySelector('.soccer-field');
    const rect = field.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  clearDrawings() {
    const svg = document.querySelector('.soccer-field svg');
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }
    this.drawnElements = [];
  }

  createSVGContainer() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.pointerEvents = 'none';
    document.querySelector('.soccer-field').appendChild(svg);
    return svg;
  }

  // Add this new method to handle undo
  undoLastAction() {
    if (this.drawnElements.length > 0) {
      const lastElement = this.drawnElements.pop();
      if (lastElement) {
        lastElement.remove();
      }
    }
  }
}

// Initialize the lineup builder
document.addEventListener('DOMContentLoaded', () => {
  const lineupBuilder = new LineupBuilder();
}); 