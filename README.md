# secrets
This application allows registered users to view anonymous secrets that other registered users have submitted. This implements authentication with Google using OAuth.

Deployed on Render: https://secrets-cgkc.onrender.com 

# How to Run Locally
```
brew services start mongodb-community@4.4
```
In a separate working directory
```
node app.js
```
# How to Use Mongo Shell
```
mongo

help

show dbs

use <database>

show collections

db.<database>.find()
```
