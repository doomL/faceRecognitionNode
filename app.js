const express = require('express')
const path = require('path')
const http = require('http')
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
    secret: process.env.SESSION_SECRET || 'change-me',
    resave: true,
    saveUninitialized: true,
    secure: false
}))

var con

function dbConnect() {
    con = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'recognitioncam'
    })
    con.connect(function(err) {
        if (err) {
            console.log('DB connection failed, retry in 3s:', err.message)
            setTimeout(dbConnect, 3000)
            return
        }
        console.log("+++DB Connected!+++")
    })
    con.on('error', function(err) {
        console.log('DB error:', err.code)
        if (err.fatal) dbConnect()
    })
}

dbConnect();

var transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    auth: {
        user: process.env.SMTP_USER || 'apikey',
        pass: process.env.SMTP_PASS
    }
});

const port = process.env.PORT || 3000

function scanFaces() {
    const facesRoot = path.join(__dirname, 'public/images/faces')
    const people = []
    const seen = new Set()

    function walkDir(dir) {
        let entries
        try { entries = fs.readdirSync(dir) } catch (e) { return }
        const images = entries.filter(f => /\.(png|jpg|jpeg)$/i.test(f))
        if (images.length > 0) {
            const name = path.basename(dir)
            if (!seen.has(name)) {
                seen.add(name)
                const rel = path.relative(path.join(__dirname, 'public'), dir)
                people.push({
                    name,
                    preview: '/' + rel.replace(/\\/g, '/') + '/' + images[0],
                    count: images.length
                })
            }
        }
        entries.filter(f => {
            try { return fs.statSync(path.join(dir, f)).isDirectory() } catch (e) { return false }
        }).forEach(sub => walkDir(path.join(dir, sub)))
    }

    walkDir(facesRoot)
    return people
}

app.get('/volti', function(req, res) {
    if (!req.session.loggato) return res.redirect('/login')
    res.render('volti.njk', { session: req.session, people: scanFaces() })
})

app.get('/', function(req, res) {
    console.log(req.session.username)
    res.render('landing.njk', { session: req.session, name: 'Main page' });
});

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
        from: process.env.MAIL_FROM || 'info@recognitioncam.com',
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
    fs.mkdirSync(__dirname + "/public/images/faces/" + req.session.username + "/" + req.body.name, { recursive: true });
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
        if (err || !result[0]) {
            return res.sendStatus(400)
        }
        req.session.loggato = 1
        req.session.username = username
        req.session.numVolti = result[0]["numVolti"]
        req.session.premium = result[0]["premium"]
        req.session.email = result[0]["email"]
        console.log("Login Done " + req.session.username)
        res.end('{"success" : "Successfully", "status" : 200}');
    })
})

app.post('/registration', (req, res) => {
    var username = req.body.name
    var password = req.body.pass
    var email = req.body.email
    var insertionQuery = "INSERT INTO user(username,password,email,admin,numVolti,premium,plus) VALUES (?,?,?,?,?,?,?)"
    con.query(insertionQuery, [username, password, email, 0, 0, 0, 0],
        function(err, result, fields) {
            console.log("INSERITO")
            console.log(result)
            fs.mkdirSync(__dirname + "/public/images/faces/" + username)
            res.end('{"success" : "Successfully", "status" : 200}');
        });
})

app.get('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

var server = http.createServer(app)
server.listen(port, () => { console.log("listening on port: " + port) });
