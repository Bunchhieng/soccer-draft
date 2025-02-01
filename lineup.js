const FORMATION_POSITIONS = {
  '4-4-2': {
    positions: [
      { x: 50.0, y: 85.0 },  // GK
      { x: 20.0, y: 70.0 },  // RB
      { x: 40.0, y: 70.0 },  // RCB
      { x: 60.0, y: 70.0 },  // LCB
      { x: 80.0, y: 70.0 },  // LB
      { x: 30.0, y: 50.0 },  // RM
      { x: 50.0, y: 50.0 },  // CM
      { x: 70.0, y: 50.0 },  // CM
      { x: 50.0, y: 30.0 },  // RF
      { x: 30.0, y: 30.0 },  // CF
      { x: 70.0, y: 30.0 }   // LF
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '4-3-3': {
    positions: [
      { x: 50, y: 85 },  // GK
      { x: 20, y: 70 },  // RB
      { x: 40, y: 70 },  // RCB
      { x: 60, y: 70 },  // LCB
      { x: 80, y: 70 },  // LB
      { x: 30, y: 50 },  // RM
      { x: 50, y: 50 },  // CM
      { x: 70, y: 50 },  // LM
      { x: 30, y: 30 },  // RW
      { x: 50, y: 30 },  // CF
      { x: 70, y: 30 }   // LW
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '3-5-2': {
    positions: [
      { x: 50, y: 85 },  // GK
      { x: 30, y: 70 },  // RCB
      { x: 50, y: 70 },  // CB
      { x: 70, y: 70 },  // LCB
      { x: 20, y: 50 },  // RWB
      { x: 80, y: 50 },  // LWB
      { x: 40, y: 50 },  // RM
      { x: 60, y: 50 },  // LM
      { x: 50, y: 30 },  // CAM
      { x: 30, y: 30 },  // CF
      { x: 70, y: 30 }   // CF
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '4-2-3-1': {
    positions: [
      { x: 50, y: 85 },  // GK
      { x: 20, y: 70 },  // RB
      { x: 40, y: 70 },  // RCB
      { x: 60, y: 70 },  // LCB
      { x: 80, y: 70 },  // LB
      { x: 35, y: 50 },  // RDM
      { x: 65, y: 50 },  // LDM
      { x: 30, y: 30 },  // RAM
      { x: 50, y: 30 },  // CAM
      { x: 70, y: 30 },  // LAM
      { x: 50, y: 15 }   // ST
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '3-4-3': {
    positions: [
      { x: 50, y: 85 },  // GK
      { x: 30, y: 70 },  // RCB
      { x: 50, y: 70 },  // CB
      { x: 70, y: 70 },  // LCB
      { x: 20, y: 50 },  // RWB
      { x: 80, y: 50 },  // LWB
      { x: 40, y: 50 },  // RM
      { x: 60, y: 50 },  // LM
      { x: 30, y: 30 },  // RW
      { x: 50, y: 30 },  // CF
      { x: 70, y: 30 }   // LW
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  '5-3-2': {
    positions: [
      { x: 50, y: 85 },  // GK
      { x: 20, y: 70 },  // RWB
      { x: 35, y: 70 },  // RCB
      { x: 50, y: 70 },  // CB
      { x: 65, y: 70 },  // LCB
      { x: 80, y: 70 },  // LWB
      { x: 35, y: 50 },  // RM
      { x: 50, y: 50 },  // CM
      { x: 65, y: 50 },  // LM
      { x: 40, y: 30 },  // RF
      { x: 60, y: 30 }   // LF
    ],
    priority: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
};

class LineupBuilder {
  constructor() {
    this.players = [];
    this.currentPlayer = null;
    this.isDragging = false;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.generatePlayers(11);
    this.updateJerseyColors();
  }

  setupEventListeners() {
    // Player count change
    document.getElementById('player-count').addEventListener('change', (e) => {
      this.generatePlayers(parseInt(e.target.value));
    });

    // Save image button
    document.getElementById('save-image').addEventListener('click', () => {
      this.saveAsImage();
    });

    // Jersey color change with immediate update
    const jerseyColorInput = document.getElementById('jersey-color');
    jerseyColorInput.addEventListener('input', () => {
      this.updateJerseyColors();
    });
    jerseyColorInput.addEventListener('change', () => {
      this.updateJerseyColors();
    });

    // Text color change with immediate update
    const textColorInput = document.getElementById('text-color');
    textColorInput.addEventListener('input', () => {
      this.updateJerseyColors();
    });
    textColorInput.addEventListener('change', () => {
      this.updateJerseyColors();
    });

    // Formation change
    document.getElementById('formation').addEventListener('change', () => {
      const count = parseInt(document.getElementById('player-count').value);
      this.generatePlayers(count);
    });

    // Lineup name change
    document.getElementById('lineup-name').addEventListener('input', (e) => {
      const title = document.getElementById('field-title');
      title.textContent = e.target.value;
    });

    document.querySelector('.toggle-settings').addEventListener('click', function() {
      const panel = document.querySelector('.settings-panel');
      panel.classList.toggle('expanded');
      
      // Toggle lineup name visibility
      const lineupName = document.getElementById('lineup-name');
      lineupName.style.display = panel.classList.contains('expanded') ? 'block' : 'none';
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
      jerseyIcon.style.color = '#001f3f'; // Jersey color
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
      nameElement.textContent = 'Click to edit';
      nameElement.contentEditable = true;
      nameElement.style.position = 'absolute';
      nameElement.style.top = '100%';
      nameElement.style.width = '100%';
      nameElement.style.textAlign = 'center';
      nameElement.style.color = 'white';
      nameElement.style.fontSize = '1rem';
      nameElement.style.minWidth = '100px';
      player.appendChild(nameElement);
      
      const { x, y } = positions[i];
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
    html2canvas(field, {
      useCORS: true,
      logging: true,
      scale: 2, // Increase scale for better quality
      backgroundColor: null // Make background transparent
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'lineup.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }).catch(err => {
      console.error('Error generating image:', err);
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
    };

    if (isTouchDevice) {
      // For touch devices, only use touchstart
      element.addEventListener('touchstart', handleFocus, { passive: false });
      element.removeEventListener('mousedown', handleFocus);
    } else {
      // For non-touch devices, use mousedown
      element.addEventListener('mousedown', handleFocus);
      element.removeEventListener('touchstart', handleFocus);
    }

    element.addEventListener('blur', handleBlur);
  }
}

// Initialize the lineup builder
document.addEventListener('DOMContentLoaded', () => {
  const lineupBuilder = new LineupBuilder();
}); 