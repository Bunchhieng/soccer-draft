const FORMATION_POSITIONS = {
  '4-4-2': {
    positions: [
      { x: 50, y: 85 },  // GK
      { x: 20, y: 70 },  // RB
      { x: 40, y: 70 },  // RCB
      { x: 60, y: 70 },  // LCB
      { x: 80, y: 70 },  // LB
      { x: 30, y: 50 },  // RM
      { x: 50, y: 50 },  // CM
      { x: 70, y: 50 },  // CM
      { x: 50, y: 30 },  // RF
      { x: 30, y: 30 },  // CF
      { x: 70, y: 30 }   // LF
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
      numberElement.contentEditable = true;
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
      const handleEdit = (element) => {
        element.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          element.contentEditable = true;
          if (element === nameElement && element.textContent === 'Click to edit') {
            element.textContent = '';
          }
          element.focus();
        });
        element.addEventListener('blur', () => {
          if (element === nameElement) {
            element.contentEditable = false;
            if (element.textContent.trim() === '') {
              element.textContent = 'Click to edit';
            }
          }
        });
      };
      
      handleEdit(numberElement);
      handleEdit(nameElement);
      
      container.appendChild(player);
      this.players.push(player);
    }
    this.updateJerseyColors();
  }

  handleMouseDown(e) {
    // Only handle clicks on the player element, not its children
    if (!e.target.classList.contains('player')) return;
    
    e.preventDefault();
    this.isDragging = true;
    const player = e.target;
    player.style.zIndex = 1000;
    player.style.transition = 'none';

    const moveHandler = (moveEvent) => {
      if (this.isDragging) {
        const container = document.querySelector('.players-container');
        const fieldLines = document.querySelector('.field-lines');
        const fieldRect = fieldLines.getBoundingClientRect();

        // Calculate position relative to container
        const x = (moveEvent.clientX - fieldRect.left) / fieldRect.width * 100;
        const y = (moveEvent.clientY - fieldRect.top) / fieldRect.height * 100;
        
        // Constrain within field lines
        const constrainedX = Math.max(0, Math.min(100 - 8, x));
        const constrainedY = Math.max(0, Math.min(100 - 8, y));
        
        player.style.left = `${constrainedX}%`;
        player.style.top = `${constrainedY}%`;
      }
    };

    const upHandler = () => {
      this.isDragging = false;
      player.style.zIndex = '';
      player.style.transition = 'all 0.2s ease';
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }

  handleTouchStart(e) {
    e.preventDefault();
    this.isDragging = true;
    const player = e.target;
    player.style.zIndex = 1000;
    player.style.transition = 'none';
  }

  handleTouchMove(e) {
    if (this.isDragging) {
      const player = e.target;
      const touch = e.touches[0];
      const container = document.querySelector('.players-container');
      const fieldLines = document.querySelector('.field-lines');
      const fieldRect = fieldLines.getBoundingClientRect();

      // Calculate position relative to container
      const x = (touch.clientX - fieldRect.left) / fieldRect.width * 100;
      const y = (touch.clientY - fieldRect.top) / fieldRect.height * 100;
      
      // Constrain within field lines
      const constrainedX = Math.max(0, Math.min(100 - 8, x));
      const constrainedY = Math.max(0, Math.min(100 - 8, y));
      
      player.style.left = `${constrainedX}%`;
      player.style.top = `${constrainedY}%`;
    }
  }

  handleTouchEnd() {
    this.isDragging = false;
    const player = event.target;
    player.style.zIndex = '';
    player.style.transition = 'all 0.2s ease';
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
    html2canvas(field).then(canvas => {
      const link = document.createElement('a');
      link.download = 'lineup.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  }
}

// Initialize the lineup builder
document.addEventListener('DOMContentLoaded', () => {
  const lineupBuilder = new LineupBuilder();
}); 