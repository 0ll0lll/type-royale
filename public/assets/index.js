// Make connection
const socket = io.connect('/')
// const socket = io.connect('https://type-royale.herokuapp.com/')
// const socket = io.connect('http://localhost:3000')

let nickname = document.getElementById('nickname'),
	ready = document.getElementById('ready'),
	alert = document.getElementById('alert')


let startGame = () => {
	if (nickname.value == false) {
		alert.textContent = "Your nickname can't be empty"
		setTimeout(() => {
			alert.textContent = ''
		}, 2500)
	} else if (nickname.value.indexOf(' ') >= 0) {
		alert.textContent = 'Sorry, no spaces'
		setTimeout(() => {
			alert.textContent = ''
		}, 2500)
	} else if (nickname.value.length <= 11 && nickname.value.indexOf(' ') < 0) {
		socket.emit('addPlayer', nickname.value.toLowerCase())
		localStorage.setItem('name', nickname.value.toLowerCase())
		window.location = window.location + 'game'
	} else {
		alert.textContent = 'Your nickname is too long. 11 characters max'
		setTimeout(() => {
			alert.textContent = ''
		}, 2500)
	}
}



//Emit socket events
ready.addEventListener('click', (e) => {
	startGame()
})

nickname.addEventListener('keydown', (e) => {
	if (e.which === 13) {
		startGame()
	}
})

//Listening to socket events
socket.on('playerAdded', (data) => {
	console.log(data)
})
