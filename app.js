    const express = require('express')
    const handlebars = require('express-handlebars')
    const Handlebars = require('handlebars')
    const bodyParser = require('body-parser')
    const fs = require('fs');
    const passport = require("passport");
    const qr = require('qr-image');
    const fileupload = require('express-fileupload')
    const H = require('just-handlebars-helpers');
    require("./config/auth")(passport)
    H.registerHelpers(Handlebars);

// app
    const app = express()

// routes
    const admin_panel = require("./routes/admin_panel")
    const manager_panel = require("./routes/manager_panel")


    const path = require('path')
    const mongoose = require("mongoose")
    const session = require("express-session")
    const flash = require("connect-flash")
    require("./models/Page")
    const Page = mongoose.model("pages")
//config
    //sessão
        app.use(session({
            secret: "cursonode",
            resave : true,
            saveUninitialized: true
        }))
        app.use(passport.initialize())
        app.use(passport.session())
        app.use(flash())

    //middleware
        app.use((req, res, next) => {
            res.locals.success_msg = req.flash("success_msg")
            res.locals.error_msg = req.flash("error_msg")
            res.locals.user = req.user || null;
            next()
        })

    // temp files for backup restore
        app.use(fileupload({
            useTempFiles : true,
            tempFileDir : '/tmp/'
        }));

    //body parser
        app.use(bodyParser.urlencoded({extended: true}))
        app.use(bodyParser.json())
        
    //handlebars
        app.engine('handlebars', handlebars({defaultLayout: 'main'}))
        app.set('view engine', 'handlebars');
    
    //mongoose
        mongoose.Promise = global.Promise;
        mongoose.connect("mongodb+srv://user:tatumercantil@clustertcc-qbnmq.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true }).then(() => {
            console.log("connected!")
        }).catch((err) => {
            console.log("connection error: "+err)
        })

    // Public
        app.use(express.static(path.join(__dirname, 'public')));

    // Routes
        //home
        app.get('/', (req, res) => {
            Page.find().then((pages) => {
                res.render('index', {pages: pages})
            }).catch((err) => {
                 console.log(err)
                 req.flash('error_msg', '')
                res.redirect("/404")
            })
        })

        // login
        app.get('/login', (req, res) => {
            if(req.isAuthenticated()){
                res.redirect('/');
            }else{
                res.render('usuarios/login');
            }               
        })

        app.post('/login', (req, res, next) => {
            passport.authenticate('local', {
                successRedirect: '/verify',
                failureRedirect: './login',
                failureFlash: true
            })(req,res,next)
        })

        // verify
        app.get('/verify', (req, res) => {
            if (req.isAuthenticated() && req.user.privilege == 1) {
                req.flash('success_msg', 'Bem vindo ao painel do Administrador!');
                res.redirect("./admin_panel")               
            }else if (req.isAuthenticated() && req.user.privilege == 0) {
                req.flash('success_msg', 'Bem vindo ao painel do Gestor!');
                res.redirect("./manager_panel/managepage")
            }
        })

        // External routes
            app.use('/admin_panel', admin_panel);
            app.use('/manager_panel', manager_panel);        

        // Logout
        app.get('/logout', (req, res) => {
            if(req.isAuthenticated()){
                req.logout();
                req.flash('success_msg', 'Deslogado com sucesso');
            } 
            res.redirect('/');
        });
        
        app.get('/page/:slug', (req, res) => {
            Page.findOne({slug: req.params.slug}).then((page) => {
                if(page){
                    res.render("pages/index", {page: page})
                }else{
                    res.redirect("/")
                }
            }).catch((err) => {
                console.log(err)
                req.flash('error_msg', 'Houve um erro ao ser redirecionado.')
                res.redirect("/")
            })
        })

        // Error 404
            app.get('*', (req, res) => {
                res.send("<h1>Error 404</h1><p>Page Not Found</p>")
            });

//Port definition
        const PORT = process.env.PORT || 3000;
            app.listen(PORT, () => {
                console.log('Server running...');
            });