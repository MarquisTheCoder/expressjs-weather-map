

const express = require('express')

const app = express()

app.listen(3000)

app.set('view engine', 'ejs')

app.use(express.static(__dirname + '/public'));

//handles request and response of website
app.get('/', (req, res) =>{
     console.log('get request recieved')
     res.status(200).render('index')
})

