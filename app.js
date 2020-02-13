const express = require('express')
const path = require('path')
const { get } = require('request')
const https = require('https')
const fs = require('fs')
const mysql = require('mysql')
const nodemailer = require('nodemailer')
const bodyParser = require('body-parser')
const nunjucks = require('nunjucks')
const date = require('date-and-time')
const app = express()

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.set('view engine', 'njk');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
//Mysql DB setting

var con = mysql.createConnection({
    host: "localhost",
    user: "admin",
    database: "arsistant"
})
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

//mail send setting
var transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: "465",
    //service: "gmail",
    auth: {
        user: "apikey",
        pass: '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'
    }
});

// con.connect(function(err) {
// if (err) throw err;
con.query("SELECT email FROM user where username= ?", ["utente1"], function(err, result, fields) {
    // if (err) throw   err;
    console.log(result[0]["email"]);
});
// });

const port = 3000
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, 'weights')))
app.use(express.static(path.join(__dirname, 'dist')))
app.use(express.static(path.join(__dirname, 'node_modules/nunjucks/browser')))
var key = fs.readFileSync(__dirname + '/certs/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/certs/selfsigned.crt');

var options = {
    key: key,
    cert: cert
};


app.get('/', function(req, res) {
    console.log("dwadwadawdw")
    res.render('index.njk', { name: 'Main page' });
});
//app.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'index.njk')))

//app.get('/dataset', (req, res) => res.sendFile(path.join(viewsDir, 'dataset.njk')))

app.get('/dataset', function(req, res) {
    res.render('dataset.njk', { name: 'Main page' });
});

app.post('/intruder', (req, res) => {
    var emailUt
    var now = Date();
    console.log(now)
        //date.format(now, 'ddd, MMM DD YYYY'); // => 'Fri, Jan 02 2015'
    con.query("SELECT email FROM user where username= ?", ["utente1"], function(err, result, fields) {
        if (err) throw err;
        emailUt = result[0]["email"];
    });
    console.log("intruso")
    var mailOptions = {
        from: 'info@recognitioncam.com',
        to: 'www.domenico.96@gmail.com',
        subject: now,
        text: 'Attenzione! Una persona, con volto non riconosciuto, è appena entrata in casa.',
        //html: "<h1>dwaewae</h1> <img alt=\"" + req.body.canvas + "\"/>" // html body
        attachments: [{
                // encoded string as an attachment
                filename: now + ".png",
                content: req.body.canvas.split("base64,")[1],
                encoding: 'base64'
            },
            {
                // encoded string as an attachment
                filename: now + ".mp4",
                content: req.body.video,
            }
        ]
    };
    // transporter.sendMail(mailOptions, function(error, info) {
    //     if (error) {
    //         console.log(error);
    //     } else {
    //         console.log('Email sent: ' + info.response);
    //     }
    // });
})


app.post('/dataset', (req, res) => {
    //console.log(__dirname)
    //console.log(req.body.images)
    var i;
    for (i = 0; i < 5; i++)
        fs.writeFileSync(__dirname + "/examples" + i + ".png", req.body.images[i].replace(/^data:image\/png;base64,/, ""), { encoding: 'base64' })
        // Save the string "Hello world!" in a file called "hello.txt" in
        // the directory "/tmp" using the default encoding (utf8).
        // This operation will be completed in background and the callback
        // will be called when it is either done or failed.

    console.log("photo taken!")
})


var server = https.createServer(options, app)
server.listen(port, () => { console.log("listening on port: " + port) });