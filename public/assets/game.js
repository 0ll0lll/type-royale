// Make connection 
const socket = io.connect('/')
// const socket = io.connect('https://type-royale.herokuapp.com/')
// const socket = io.connect('http://localhost:3000')

//Querying the DOM
let players = document.getElementById('playersList').
	nickname = document.getElementById('nickname'),
	health = document.getElementById('health-bar'),
	shield = document.getElementById('shield-bar'),
	inputText = document.getElementById('message'),
	action = document.getElementById('action'),
	indentory = document.getElementById('inventory'),
	alert = document.getElementById('alert'),
	playersList = document.getElementById('playersList'),
	timeline = document.getElementById('timeline-text'),
	newGame = document.getElementById('new-game'),
	victory = document.getElementById('victory'),
	closeBtn = document.getElementById('close'),
	info = document.getElementById('info-container'),
	infoBtn = document.getElementById('info-btn')

if (localStorage.getItem('shown') === 'true') {
	info.style.display = 'none'
}

//Emit socket events
window.onload = () => {
	socket.emit('getPlayers', localStorage.getItem('name'))
}

newGame.addEventListener('click', () => {
	socket.emit('newGame', 'new game requested')
})

closeBtn.addEventListener('click', () => {
	info.style.display = 'none'
	localStorage.setItem('shown', true)
})

infoBtn.addEventListener('click', () => {
	info.style.display = 'block'
})

inputText.addEventListener('keydown', (e) => {
	if (e.which === 13) {
		let input = inputText.value.split(' ')
		let action = input[0]
		let name = input[1]
		let item = input[2]

		switch (action) {
			case 'loot':
				playSound('loot')
				socket.emit('loot', socket.id)
				break;
			case 'attack':
				if (!name || !item) {
					showError('ERROR: attack what?')
				} else {
					showAlert('D I E ')

					switch (item) {
						case 'pistol':
							playSound('pistol')
							break;
						case 'shotgun':
							playSound('shotgun')
							break;
						case 'rifle':
							playSound('rifle')
							break;
					}
					socket.emit('attack', {
						id: socket.id,
						name: name,
						item: item
					})
				}
				break;
			case 'use':
				showAlert('MEDIC!!! MEDIC!!!!')
				switch (name) {
					case 'medkit':
						playSound('medkit')
						break;
					case 'shield':
						playSound('shield')
						break;
				}
				socket.emit('heal', {
					id: socket.id,
					item: name  // Since in this case we don't use player name Item is stored in name variable
				})
				break;
			default: 
				showError(`WTF ${inputText.value} is?`)
		}
		inputText.value = ''
	}
})

// UI Functions
let playSound = (weapon) => {
	let audio = new Audio(`assets/audio/${weapon}.mp3`)
	audio.play()
}

let showAlert = (text) => {
	alert.textContent = text
	alert.style.backgroundColor = '#0C6AFF'
	alert.style.display = 'block'
	setTimeout(() => {
		alert.style.display = 'none'
	}, 1000)
}

let showError = (text) => {
	alert.textContent = text
	alert.style.backgroundColor = '#FF0771'
	alert.style.display = 'block'
	setTimeout(() => {
		alert.style.display = 'none'
	}, 1500)
}

let displayPlayerStats = (data) => {
	// Display player's stats
	data.forEach(player => {
		if (player.id === socket.id) {
			
			inventory.innerHTML = '<p class="text">inventory</p>'
			
			// Display player's Health and Shield
			nickname.textContent = player.name
			health.style.width = `${player.health}px`
			shield.style.width = `${player.shield}px`
			health.textContent = `${player.health}/200`
			shield.textContent = `${player.shield}/200`
			// Display player's inventory

			let createIconDiv = (itemName, amount) => {
				let inventoryElement = document.createElement('div')
				let itemInitial
				inventoryElement.classList.add('icon')

				// Turning weapon name into an initial (pistol > P)
				switch (itemName) {
					case 'pistol':
						itemInitial = 'P'
						break;
					case 'shotgun':
						itemInitial = 'SG'
						break;
					case 'rifle':
						itemInitial = 'R'
						break;
					case 'shield':
						itemInitial = 'S'
						break;
					case 'medkit':
						itemInitial = 'M'
						break;
				}

				if (amount > 1) {
					inventoryElement.innerHTML = `${itemInitial}<p class="amount">x${amount}</p>`
					return inventoryElement
				} else if (amount === 1) {
					inventoryElement.innerHTML = itemInitial
					return inventoryElement
				} 
			}

			player.inventory.forEach((item) => {
				if (item.amount > 0) {
					inventory.appendChild(createIconDiv(item.itemName, item.amount))
				}
			})
		}
	})

}

let displayAllPlayers = (data) => {
	playersList.innerHTML = ''
	let pound
	data.forEach((player) => {

		let createPlayerDiv = () => {
			let playerDiv = document.createElement('div')
			playerDiv.className += 'player'
			playerDiv.innerHTML = `<p class="player-name">${player.name}</p>`
			// Display health as '###########'
			pound = ''
			for(i = 0; i < player.health; i+=10) {
				pound += '#'
			}
			playerDiv.innerHTML += `<p class="player-health">${pound}</p>`
			// Display shield as '###########'
			pound = ''
			for(i = 0; i < player.shield; i+=10) {
				pound += '#'
			}
			playerDiv.innerHTML += `<p class="player-shield">${pound}</p>`

			return playerDiv	
		}

		playersList.appendChild(createPlayerDiv())
	})
}

let displayTimeline = (message) => {

let createMessageP = () => {
	let messageP = document.createElement('p')
	messageP.className += 'text'
	messageP.textContent = message
	return messageP
}

timeline.appendChild(createMessageP())
}

//Listening to socket events
socket.on('displayPlayers', (data) => {
	displayAllPlayers(data.players)
	displayPlayerStats(data.players)
})

socket.on('attack', (data) => {
	// Change styles when you die
	data.deadPlayers.forEach((player) => {
		if (player.id === socket.id) {
			if (player.isDead === true) {
				victory.innerHTML = `<h2>You're dead</h2><p>⚰️ We are sorry ⚰️</p>`
				victory.style.backgroundColor = '#FF0771'
				victory.style.borderColor = '#FF0771'
				victory.style.boxShadow = '0px 0px 40px 0 #FF0771'
				victory.style.display = 'block'
				inputText.disabled = true;
				setTimeout(() => {
					playSound('death')
				}, 600)
			}
		}
		// Display player's Health and Shield
		health.style.width = `${player.health}px`
		shield.style.width = `${player.shield}px`
		health.textContent = `${player.health}/200`
		shield.textContent = `${player.shield}/200`
	})

	data.players.forEach((player) => {
		if (player.id === socket.id) {
			if (data.players.length === 1) {
				victory.style.display = 'block'
				setTimeout(() => {
					playSound('victory')
				}, 1000)
			}
		}
	})

	displayAllPlayers(data.players)
	displayPlayerStats(data.players)
	displayTimeline(data.message.attackMesage)
	displayTimeline(data.message.deathMessage)
	timeline.scrollIntoView(false)
	playersList.scrollIntoView(false)
})

socket.on('loot', (data) => {
	data.players.forEach((player) => {
		if (player.id === socket.id) {
			showAlert(`found: ${player.inventory[5].message}`)
		}
	})
	displayPlayerStats(data.players)
})

socket.on('newGame', (data) => {
	window.location = '/'
})







