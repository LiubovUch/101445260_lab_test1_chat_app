const bcrypt = require('bcryptjs');

const app = require('express')();
const http = require('http').createServer(app);
const mongoose = require('mongoose');
const cors = require('cors');
const socketio = require('socket.io');
const io = socketio(http);
const bodyParser = require('body-parser');
require('dotenv/config');
app.use(bodyParser.urlencoded({ extended: false }));

const User = require("./models/user");
const Message = require("./models/message");

app.use(cors());

mongoose.connect(process.env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to Database.");
}).catch(err => {
    console.log(err);
    console.log("Could not connect to the Database.");
    process.exit();
});

app.get("/", (req, res) => {
    res.sendFile(__dirname + '/login.html');
});

app.get("/register", (req, res) => {
    res.sendFile(__dirname + '/register.html');
});

app.get("/chat", (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

app.post('/register', async (req, res) => {
    try {

        const hashedPassword = await bcrypt.hash(req.body.password, 10); 

   
        const newUser = new User({
            username: req.body.username,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            password: hashedPassword 
        });

        await newUser.save();
        res.redirect('/');
    } catch (err) {
        console.log(err);
        res.redirect('/register');
    }
});

let users = '';
app.post("/", async (req, res) => {
    const uName = req.body.username;
    const pWord = req.body.password;

    if (uName != "" && pWord != "") {
        User.findOne({ username: uName }, async (err, data) => { 
            users = uName;
            try {
                if (data) {
                    const match = await bcrypt.compare(pWord, data.password);
                    if (match) {
                        res.redirect('/chat');
                    } else {
                        res.redirect('/');
                    }
                } else {
                    res.redirect('/');
                }
            } catch (err) {
                console.log(err);
            }
        });
    };
});


io.on('connection', socket => {
    console.log("New Socket connected...");

    socket.emit('message', "Welcome to the chat");

    socket.on('joinRoom', room => {
        socket.join(room);

        Message.find({ room: room }, (err, messages) => {
            if (err) {
                console.log(err);
            } else {

                socket.emit('previousMessages', messages.map(msg => msg.message));
            }
        });

        socket.on('chatMessage', msg => {
            if (room == 'devops' || room == 'cloud computing' || room == 'NodeJS' || room == 'sports' || room == 'covid19') {
                socket.to(room).emit('message', msg);
                const input_message = new Message({
                    from_user: users,
                    room: room,
                    message: msg
                });
                input_message.save().then(() => {
                    console.log('Message saved to database');
                });
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected...');
    });
});


const PORT = 3000 || process.env.PORT;

http.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
