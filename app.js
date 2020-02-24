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
const multiparty = require('multiparty')
const session = require('express-session')
const multer = require('multer');

const app = express()

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, 'weights')))
app.use(express.static(path.join(__dirname, 'dist')))
    //app.use(express.static(path.join(__dirname, 'node_modules/nunjucks/browser')))

const upload = multer();
var htmlEmail = fs.createReadStream('EmailTemplate.html');

app.set('view engine', 'njk');
nunjucks.configure('views', {
    autoescape: true,
    express: app
});


app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(session({
    secret: 'N12uUF6cVT',
    resave: true,
    saveUninitialized: true,
    secure: false
}))

session.username
    //Mysql DB setting

//Local Db
var con = mysql.createConnection({
    host: "localhost",
    user: "admin",
    database: "arsistant"
})

//Heroku ClearDb
// var con = mysql.createConnection({
//     host: "eu-cdbr-west-02.cleardb.net",
//     user: "b39e59a0dee129",
//     password: "2994439f",
//     database: "heroku_1b8eb32b46dbbf3"
// })

con.connect(function(err) {
    if (err) throw err;
    console.log("+++DB Connected!+++");
});

//mail send setting
var transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: "465",
    auth: {
        user: "apikey",
        pass: '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'
    }
});

const port = 3000

var key = fs.readFileSync(__dirname + '/certs/selfsigned.key');
var cert = fs.readFileSync(__dirname + '/certs/selfsigned.crt');

var options = {
    key: key,
    cert: cert
};


app.get('/', function(req, res) {
    console.log(req.session.username)
    res.render('landing.njk', { session: req.session, name: 'Main page' });
});
//app.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'index.njk')))

//app.get('/dataset', (req, res) => res.sendFile(path.join(viewsDir, 'dataset.njk')))

app.get('/landing', function(req, res) {
    console.log(req.session.username)
    res.render('landing.njk', { session: req.session, name: 'Main page' });
});
app.get('/login', function(req, res) {
    res.render('login.njk', { name: 'Main page' });
});
app.get('/admin', function(req, res) {
    res.render('admin.njk', { name: 'Main page' });
});
app.get('/camera', function(req, res) {
    res.render('camera.njk', { session: req.session, name: 'Main page' });
});
app.get('/dataset', function(req, res) {
    res.render('dataset2.njk', { session: req.session, name: 'Main page' });
});
app.get('/signUp', function(req, res) {
    res.render('signUp.njk', { name: 'Main page' });
});

app.post('/intruder', upload.any(), (req, res) => { //upload.single('video-blob')
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
        html: htmlEmail,
        //html: '<img src="cid:image1" width="30%">', // html body
        attachments: [{
                // encoded string as an attachment
                filename: now + ".webm",
                content: req.files[0].buffer,
            },
            {
                filename: now + ".png",
                content: req.files[1].buffer,
                cid: 'image1'
            },
        ]
    };
    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
    // console.log(req.files[0].canvas)
    fs.writeFileSync("dwadwa.webm", req.files[0].buffer)
    fs.writeFileSync("dwadwa.png", req.files[1].buffer)
})


app.post('/dataset', (req, res) => {
    fs.mkdirSync(__dirname + "/public/images/faces/" + req.session.username + "/" + req.body.name);
    var i;
    for (i = 0; i < 5; i++)
        fs.writeFileSync(__dirname + "/public/images/faces/" + req.session.username + "/" + req.body.name + "/" + req.body.name + i + ".png", req.body.images[i].replace(/^data:image\/png;base64,/, ""), { encoding: 'base64' })

    console.log("photo taken!")
})

app.post('/login1', (req, res) => {
    var username = req.body.name
    var password = req.body.pass
    var isAdmin
    var isEmpty = true
    selectQuery = "SELECT * FROM user WHERE username = ? AND password = ?"

    aziendaQuery = "SELECT azienda FROM user WHERE username = ? "
    con.query(selectQuery, [username, password], function(err, result, fields) {
        if (result[0] != null) {
            isEmpty = false;
            console.log("+++++++++++++++++++++++++")
            console.log(isEmpty)
        }
        console.log("dwadwad " + result[0])
        if (!isEmpty)
            var isAdmin = result[0]['admin']
                //         // return res.status(400).send({
                //         //     message: 'This is an error!'
                //         // });
                // } else {
        console.log("excvjhbkjl")
            // }
        req.session.loggato = 1
        req.session.username = username
        req.session.admin = isAdmin
        console.log("Login Done " + req.session.username)
        if (!isEmpty) {
            res.end('{"success" : "Successfully", "status" : 200}');
            console.log("wafnwjadnjwand")
        } else
            res.sendStatus(400)
            // res.end("error");

    })

    // con.query(aziendaQuery, [username], function(err, result, fields) {
    //     req.session.azienda = result[0]
    // })

})
app.post('/registration', (req, res) => {
    var username = req.body.name
    var password = req.body.pass
    var email = req.body.email
    var user = [username, password, email, 1, 1]
    var insertionQuery = "INSERT INTO user(username,password,email,azienda,admin) VALUES (?,?,?,?,?)"
    con.query(insertionQuery, [username, password, email, 1, 1],
        function(err, result, fields) {
            // if (err) throw   err;
            console.log("INSERITO")
            console.log(result)
        });
    // con.end()
    fs.mkdirSync(__dirname + "/public/images/faces/" + username)
})
app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

var server = https.createServer(options, app)
server.listen(port, () => { console.log("listening on port: " + port) });