const express = require('express')
const path = require('path')
const { get } = require('request')

const app = express()
    //METTERE IN ASCOLTO IL SERVER SULLA PORTA DESIDERATA!
app.listen(3000, () => console.log('Listening on port 3000!'))

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'weights')))
app.use(express.static(path.join(__dirname, 'dist')))

app.get('/', (req, res) => {
    res.redirect('index.html')
})