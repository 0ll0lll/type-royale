const express = require('express')
const socket = require('socket.io')


// App setup - process.env.PORT

const port = process.env.PORT || 3000
const app = express()
const server = app.listen(port, () => {
	console.log(`server is listening to ${port}`)
})

// Static files
app.use(express.static('public'))

// ejs ssetup
app.set('view engine', 'ejs')

//Game logic
let game = {
	players: [],
	deadPlayers: [],
	addPlayer(name) {
		this.players.push({
			name: name,
			id: null,
			inventory: [
				{itemName: 'pistol', amount: 0},
				{itemName: 'shotgun', amount: 0},
				{itemName: 'rifle', amount: 0},
				{itemName: 'shield', amount: 0},
				{itemName: 'medkit', amount: 0},
				{message : ''}
			],
			health: 200,
			shield: 0,
			isDead: false
		})
	},
	displayAllPlayers() {
		this.players.forEach(player => {
			// console.log(player.name.toUpperCase(), '==>', 'Health:', player.health, 'Shield:', player.shield)
			console.log(player)
			console.log(player.inventory)
		})
	},
	displayDeadPlayers() {
		this.deadPlayers.forEach(player => {
			console.log(player, '💀')
		})
	},
	attack(weapon, name, id) {
		let deathMessage
		let victim = this.players.filter((player) => {
			return player.name === name
		})

		if (victim == false) { // if true, that means that victim array is sempry and there is no player with such name
			deathMessage = 'nameError'
			return deathMessage
		} 

		this.players.forEach((player) => {
		
			if (player.id === id) { // we check who it is
				player.inventory.forEach((item) => {
					if (item.itemName === weapon && item.amount > 0) { // check if you have this weapon
						
						let damage = 0;
						let message;
						// weapon setup
						switch (weapon) {
							case 'pistol':
								damage = 15
								message = 'pew pew pew'
								break
							case 'shotgun':
								damage = 50
								message = 'pa pa pa pa pa'
								break
							case 'rifle':
								damage = 85
								message = 'BANG'
								break
						}

						// change health amout (actual attack)
						this.players.forEach((player, index) => {
							if (player.name === name) {
								// player has no shield
								if (player.shield <= 0) {
									player.health -= damage
				
									// death happens here
									if (player.health <= 0) {
										player.health = 0
										player.isDead = true
										this.deadPlayers.push(player)
										console.log(player.name, 'is dead')
										deathMessage = player.name + ' is dead... 💀⚰️👻'
										this.players.splice(index, 1)
									} 
								// player has some shield	
								} else if (player.shield > 0 && player.shield <= damage) {
									let newDamage = damage - player.shield
									player.shield = 0
									player.health -= newDamage

									// death happens here
									if (player.health <= 0) {
										player.health = 0
										player.isDead = true
										this.deadPlayers.push(player)
										console.log(player.name, 'is dead')
										deathMessage = player.name + ' is dead... 💀⚰️👻'
										this.players.splice(index, 1)
									}

								} else {
									player.shield -= damage
								}
							}
						})

						console.log(`i will make ${damage} damage to ${name} with ${item.itemName}`)
						item.amount -= 1
						if (item.amount <= 0) {
							item.amount = 0
						}
					} else if (item.itemName === weapon && item.amount === 0) {
						console.log('no bullets')
						deathMessage = 'ammoError'
						return deathMessage
					}
				})
			}
		})
		return deathMessage
	},
	heal(item, id) {
		this.players.forEach((player) => {
			if (player.id === id) {
				switch (item) {
					case 'medkit':
						if (player.inventory[4].amount > 0) { // check if player can use a medkit
							player.health += 50
							if (player.health >= 200) {
								player.health = 200
							}
						}
						player.inventory[4].amount -= 1 // remove used medkit from inventory
						if (player.inventory[4].amount <= 0) {
							player.inventory[4].amount = 0
						}
						break;
					case 'shield':
						if (player.inventory[3].amount > 0) { // check if player can use shield
							player.shield += 25
							if (player.shield >= 200) {
								player.shield = 200
							}
						}
						player.inventory[3].amount -= 1 // remove used shield from inventory
						if (player.inventory[3].amount <= 0) {
							player.inventory[3].amount = 0
						}
						break;
				}
			}
		})
	},
	loot(id) {
		let random = Math.round((Math.random() * 100))
		
		this.players.forEach((player) => {
			if (player.id === id) {
				if (random <= 30) {
					player.inventory[0].amount += 1
					player.inventory[5].message = 'pistol'
				} else if (random <= 50) {
					player.inventory[1].amount += 1
					player.inventory[5].message = 'shotgun'
				} else if (random <= 65) {
					player.inventory[2].amount += 1
					player.inventory[5].message = 'rifle'
				} else if (random <= 85) {
					player.inventory[3].amount += 1
					player.inventory[5].message = 'shield'
				} else {
					player.inventory[4].amount += 1
					player.inventory[5].message = 'medkit'
				}
			}
		})
		console.log('Я взял лут и вышел', random)
	},
	restartGame() {	
		this.players = []
		this.deadPlayers = []
	}
}

// Socket setup
const io = socket(server)

io.on('connection', (socket) => {
	socket.on('addPlayer', (data) => {
		game.addPlayer(data)
		io.sockets.emit('playerAdded', 'player has beed added')
	})	

	socket.on('getPlayers', (data) => {
		//Add socket id to a player
		game.players.forEach((player, index) => {
			if (player.name === data) {
				player.id = socket.id
			}
			console.log(data, '+++', player.name, player.id)
		})
		
		io.sockets.emit('displayPlayers', {players: game.players, deadPlayers: game.deadPlayers})
	})

	// Loot event
	socket.on('loot', (data) => {
		game.players.forEach((player) => {
			if (player.id === data) {
				game.loot(data)
			}
		})
		socket.emit('loot', {players: game.players, deadPlayers: game.deadPlayers})
	})

	// Attack event
	socket.on('attack', (data) => {
		let message = {
			attackMesage: '',
			deathMessage: ''
		}

		if (data.item === 'pistol' || data.item === 'shotgun' || data.item === 'rifle') {
			message.deathMessage = game.attack(data.item, data.name, data.id)
		} else {
			message.deathMessage = 'weaponError'
		}

		game.players.forEach((player) => {
			if (player.id === socket.id) {
				let name = player.name
				if (message.deathMessage === 'nameError') {
					message.attackMesage = `❌ ERROR: ${name.toUpperCase()} can't even spell ✍️ names right`
					message.deathMessage = ''
				} else if (message.deathMessage === 'weaponError') {
					message.attackMesage = `❌ ERROR: ${name.toUpperCase()} thinks that ${data.item.toUpperCase()} 💩 is a weapon`
					message.deathMessage = ''
				} else if (message.deathMessage === 'ammoError') {
					message.attackMesage = `❌ ERROR: ${name.toUpperCase()} thinks that they have bullets 💥 in ${data.item.toUpperCase()}`
					message.deathMessage = ''
				} else {
					message.attackMesage = `${name.toUpperCase()} attacked 🔫 poor ${data.name.toUpperCase()} with a ${data.item} 😭`
				}
			}
		})
		io.sockets.emit('attack', {players: game.players, deadPlayers: game.deadPlayers, message: message})
	})

	// Heal event
	socket.on('heal', (data) => {
		game.heal(data.item, data.id)
		io.sockets.emit('displayPlayers', {players: game.players, deadPlayers: game.deadPlayers})
	})

	// New Game event
	socket.on('newGame', (data) => {
		game.restartGame()
		socket.broadcast.emit('newGame', 'restarting your page')
	})
})

app.get('/game', (req, res) => {
	res.render('game')
})

