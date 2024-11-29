# Counter-API
This API allows you to create simple numeric counters!

It goes as:
* Create a counter for any application!
* Set the value of a counter
* Increment a counter
* Get the counters value!

All counters are accesible if you know the key!

Want to track the number of hits a page had? Sure.
Want to know the number of users that clicked on the button "View More"? There you go.

# Examples
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
### Getting a counters value
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
### Setting a counters value
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
## Multiple pages
if you want to have a counter for each individual page you can replace visits with a unique identifier for each page, i.e index, contact, item-1, item-2. 

Keys and namespaces must have at least 3 characters and less or equal to 64.

# API
## Namespaces
Namespaces are meant to avoid name collisions. You may specify a namespace when hitting a key for the first time. Its recommend use the domain of the application as namespace to avoid collision with other websites.

The key (Following the namespace should include a large jumble of letters to make sure no one tampers with it, I am the only one capable of seeing this list till I open source this project.

## Endpoints 
All requests support cross-origin resource sharing (CORS) and SSL.

Base API path: `https://my-own-counter-api-production.up.railway.app`

### `/hit/:namespace/:key`
This endpoint will create a key if it doesn't exist and increment it by one on each subsequent request.

### `/get/:namespace/:key`
Get the value of a key.

### `/set/:namespace/:key?value=:newValue`
Set the value of a key.
