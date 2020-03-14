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
const multer = require('multer')

const app = express()

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, 'weights')))
app.use(express.static(path.join(__dirname, 'dist')))
app.use(express.static(path.join(__dirname, 'layouts')))
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

//Mysql DB setting
//Local Db
localDBSettings = mysql.createConnection({
    host: "localhost",
    user: "admin",
    database: "recognitioncam"
})

//Heroku ClearDb
remoteDBSettings = mysql.createConnection({
    host: "eu-cdbr-west-02.cleardb.net",
    user: "b5a0621d59583a",
    password: "98978855",
    database: "heroku_8d1151a458eb2e9"
})

var con = localDBSettings

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
    res.render('landing.njk', { session: req.session });
});
app.get('/login', function(req, res) {
    res.render('login.njk', {});
});
app.get('/admin', function(req, res) {
    res.render('admin.njk', {});
});
app.get('/camera', function(req, res) {
    res.render('camera.njk', { session: req.session });
});
app.get('/dataset', function(req, res) {
    res.render('dataset2.njk', { session: req.session });
});
app.get('/signUp', function(req, res) {
    res.render('signUp.njk', {});
});
app.get('/profilo', function(req, res) {
    res.render('profilo2.njk', { session: req.session })
})

app.post('/intruder', upload.any(), (req, res) => {
    var emailUt
    var now = Date();
    console.log(now)
    con.query("SELECT email FROM user where username= ?", [req.session.username], function(err, result, fields) {
        if (err) throw err
        emailUt = result[0]
    });
    console.log("intruso")
    var mailOptions = {
        from: 'info@recognitioncam.com',
        to: emailUt,
        subject: now,
        text: 'Attenzione! Una persona, con volto non riconosciuto, è appena entrata in casa.',
        html: htmlEmail,
        attachments: [{
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
            console.log(error)
        } else {
            console.log('Email sent: ' + info.response)
        }
    });
})

app.post('/aggiornaAccount', (req, res) => {
    selectQuery = "UPDATE user SET premium = 1 WHERE user.username = ?"
    con.query(selectQuery, [req.session.username], function(err, result, fields) {
        console.log("premium!")
        req.session.premium = 1
    })
    res.end('{"success" : "Successfully", "status" : 200}');
})

app.post('/dataset', (req, res) => {
    fs.mkdirSync(__dirname + "/public/images/faces/" + req.session.username + "/" + req.body.name);
    var i;
    for (i = 0; i < 5; i++)
        fs.writeFileSync(__dirname + "/public/images/faces/" + req.session.username + "/" + req.body.name + "/" + req.body.name + i + ".png", req.body.images[i].replace(/^data:image\/png;base64,/, ""), { encoding: 'base64' })

    selectQuery = "UPDATE user SET numVolti = ? WHERE user.username = ?"
    con.query(selectQuery, [req.session.numVolti++, req.session.username], function(err, result, fields) {
        console.log(req.session.numVolti)
    })
    console.log("photo taken!")
})
app.post('/login1', (req, res) => {
    var username = req.body.name
    var password = req.body.pass
    var isEmpty = true
    selectQuery = "SELECT * FROM user WHERE username = ? AND password = ?"
    console.log(password)
    con.query(selectQuery, [username, password], function(err, result, fields) {
        if (result[0] != null) {
            isEmpty = false;
            console.log("+++++++++++++++++++++++++")
            console.log(isEmpty)
        }
        console.log("dwadwad " + result[0]["numVolti"])
        req.session.loggato = 1
        req.session.username = username
        req.session.numVolti = result[0]["numVolti"]
        req.session.premium = result[0]["premium"]
        req.session.email = result[0]["email"]
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
    var insertionQuery = "INSERT INTO user(username,password,email,admin,numVolti,premium,plus) VALUES (?,?,?,?,?,?,?)"
    con.query(insertionQuery, [username, password, email, 0, 0, 0, 0],
        function(err, result, fields) {
            // if (err) throw   err;
            console.log("INSERITO")
            console.log(result)
            fs.mkdirSync(__dirname + "/public/images/faces/" + username)
            res.end('{"success" : "Successfully", "status" : 200}');
        });
    // con.end()
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

var server = https.createServer(options, app)
server.listen(port, () => { console.log("listening on port: " + port) });