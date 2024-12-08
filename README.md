# Pirate Adventure
This is a short game that focuses on the simplicity of the flash era, will work on further :)

## Features
- Leaderboard: Track and display high scores.
- Enemies: Various enemy ships that shoot bullets.
- Currency: Collect treasures for points.
- Powerups: Collect powerups for various boosts.
  - Health: Increases health.
  - Speed: Increases ship speed temporarily.
  - Shield: Provides temporary invincibility.
  - Multiplier: Doubles the score multiplier temporarily.
  - Magnet: Attracts nearby treasures.
  - Time Slow: Slows down obstacles temporarily.
- Obstacles: Avoid rocks and other obstacles.
- Day/Night Cycle: Smooth transition between day and night.
- Weather Effects: Dynamic weather including rain and storms.
- Particle Effects: Visual effects for explosions and other interactions.
- Sound Effects: Various sound effects for actions like shooting, collecting, and taking damage.

## Controls
- Use arrow keys to move.
- Collect treasures ⭐.
- Avoid rocks 🪨.
- Grab powerups ❤️.

## How to Play
1. Click the "Play" button to start the game.
2. Use the arrow keys to navigate your ship.
3. Collect treasures and powerups while avoiding obstacles and enemy bullets.
4. Try to achieve the highest score and get on the leaderboard!

## API Integration
The game uses a custom API for the leaderboard system. Here are some examples of how to interact with the API:

### Creating a counter and/or hitting it to increase its value
```js
fetch('https://my-own-counter-api-production.up.railway.app/hit/example/example', {
  method: 'POST'
})
.then(response => response.json())
.then(data => {
  console.log(data); // Handle the response data
})
.catch(error => {
  console.error('Error:', error); // Handle errors
});
```

### Getting a counter's value
```js
fetch('https://my-own-counter-api-production.up.railway.app/get/me/test', {
  method: 'GET'
})
.then(response => response.json())
.then(data => {
  console.log(data); // Handle the response data
})
.catch(error => {
  console.error('Error:', error); // Handle errors
});
```

### Setting a counter's value
```js
fetch('https://my-own-counter-api-production.up.railway.app/set/me/test?value=23', {
  method: 'PUT'
})
.then(response => response.json())
.then(data => {
  console.log(data); // Handle the response data
})
.catch(error => {
  console.error('Error:', error); // Handle errors
});
```

## Multiple Pages
If you want to have a counter for each individual page, you can replace visits with a unique identifier for each page, i.e., index, contact, item-1, item-2.

Keys and namespaces must have at least 3 characters and be less than or equal to 64 characters.

## API
### Namespaces
Namespaces are meant to avoid name collisions. You may specify a namespace when hitting a key for the first time. It is recommended to use the domain of the application as the namespace to avoid collision with other websites.

### Endpoints
All requests support cross-origin resource sharing (CORS) and SSL.

Base API path: `https://my-own-counter-api-production.up.railway.app`

#### `/hit/:namespace/:key`
This endpoint will create a key if it doesn't exist and increment it by one on each subsequent request.

#### `/get/:namespace/:key`
Get the value of a key.

#### `/set/:namespace/:key?value=:newValue`
Set the value of a key.
```
