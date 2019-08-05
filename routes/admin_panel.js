// Require 
// módulos
const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcryptjs')
const fileupload = require('express-fileupload')
const backup = require('backup-mongodb');
const fs = require('fs');
const Restore = require("backup-mongodb-restorer");
const router = express.Router();
const child_process = require('child_process');
const Renamer = require('renamer')
const renamer = new Renamer()
require("../models/Account")
require("../models/Log")
// Model
const Account = mongoose.model('accounts');
const Log = mongoose.model('logs');
// Helpers
const { isAdmin } = require('../helpers/privilege')

// Erros

// admin panel
router.get("/", isAdmin, (req, res) => {
    res.render("admin_panel/index")
})

// manage account
router.get("/manageuser", isAdmin, (req, res) => {
    Account.find().then((accounts) => {
        res.render("admin_panel/manageuser", { accounts: accounts })
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao carregar a lista de usuarios.')
        console.log("erro ao listar os usuarios: " + err)
    })
})

// create accounts
router.get("/manageuser/add", isAdmin, (req, res) => {
    res.render("admin_panel/manageuseradd")
})

router.post("/manageuser/new", isAdmin, (req, res) => {
    Account.findOne({ userName: req.body.name }).then((account) => {
        //Tratamento de erros
        var erros = [];
        if (!req.body.name || typeof req.body.name == undefined || req.body.name == null) {
            erros.push({ text: "Usuário Inválido" })
        }
        if (!req.body.password || typeof req.body.password == undefined || req.body.password == null) {
            erros.push({ text: "Senha Inválida" })
        }
        if (!req.body.nameComplete || typeof req.body.nameComplete == undefined || req.body.nameComplete == null) {
            erros.push({ text: "Nome Inválido" })
        }
        if (req.body.name.length < 4) {
            erros.push({ text: "Nome de usuário muito pequeno" })
        }
        if (req.body.password.length < 8) {
            erros.push({ text: "A senha deve conter no mínimo 8 caracteres" })
        }
        if (account) {
            erros.push({ text: "Esse nome de usuário ja está cadastrado no sistema" })
        }
        if (erros.length > 0) {
            res.render('admin_panel/manageuseradd', { erros: erros })
        } else {
            const newAccount = new Account({
                userName: req.body.name,
                password: req.body.password,
                name: req.body.nameComplete
            })

            bcrypt.genSalt(10, (erro, salt) => {
                bcrypt.hash(newAccount.password, salt, (erro, hash) => {
                    if (erro)
                        console.log("erro ao encriptar :(")

                    newAccount.password = hash

                    newAccount.save().then(() => {
                        console.log("senha encriptada :)")
                        req.flash('success_msg', 'Conta de Gestor criado com sucesso!')
                        res.redirect('/admin_panel/manageuser')
                    }).catch((err) => {
                        console.log("erro ao aplicar: " + err)
                        req.flash('error_msg', 'Falha ao criar a conta.')
                        res.redirect('/admin_panel/manageuser/add')
                    })
                })
            })

        }
    })
})

// edit account
router.get("/manageuser/edit/:id", isAdmin, (req, res) => {
    Account.findOne({ _id: req.params.id }).then((accounts) => {
        res.render("admin_panel/manageuseredit", { accounts: accounts })
    }).catch((err) => {
        console.log("erro ao editar o usuario: " + err)
        res.redirect("/admin_panel/manageuser")
    })
})
router.post("/manageuser/edit", isAdmin, (req, res) => {
    Account.findOne({ _id: req.body.id }).then((accounts) => {
        var erros = []
        console.log(req.body.password)
        if (!req.body.password || typeof req.body.password == undefined || req.body.password == null) {
            erros.push({ text: "Senha Inválida" })
        }   
        if (req.body.password != req.body.newpassword) {
            erros.push({ text: "As senhas não são iguais" })
        }
        if (req.body.password.length < 8) {
            erros.push({ text: "A senha deve conter no mínimo 8 caracteres" })
        }

        if (erros.length > 0) {
            res.render('admin_panel/manageuseredit', { erros: erros })
        } else {
            accounts.password = req.body.password

            bcrypt.genSalt(10, (erro, salt) => {
                bcrypt.hash(accounts.password, salt, (erro, hash) => {
                    if (erro)
                        console.log("erro ao encriptar :(")
    
                    accounts.password = hash
    
                    accounts.save().then(() => {
                        console.log("senha encriptada :)")
                        req.flash('success_msg', 'Senha editada com sucesso!')
                        res.redirect("/admin_panel/manageuser")
                    }).catch((err) => {
                        console.log("erro ao aplicar: " + err)
                        req.flash('error_msg', 'Falha ao editar a senha.')
                        console.log("erro ao editar: " + err)
                        res.redirect('/admin_panel/manageuser/edit')
                    })
                })
            })
        }
    })
})



// delete account
router.post("/manageuser/delete", isAdmin, (req, res) => {
    Account.remove({ _id: req.body.id }).then(() => {
        req.flash('success_msg', 'Manager deletado com sucesso!')
        res.redirect("/admin_panel/manageuser")
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao deletar o manager.')
        console.log("erro ao remover conta: " + err)
    })
})

// log screen
router.get("/logscreen", isAdmin, (req, res) => {
    Log.find().sort({date: "desc"}).then((logs) => {
        res.render("./admin_panel/log", {logs: logs})
    }).catch((err) => {
         console.log(err)
         req.flash('error_msg', '')
        res.redirect("/404")
    })
    //res.render("./admin_panel/log")
})

router.get("/backup", isAdmin, (req, res) => {
    res.render("admin_panel/backup")
})

// backup screen
router.get("/backup/send/", isAdmin, (req, res) => {
    fs.unlinkSync(__dirname + '/../backup/')
    new backup('mongodb://localhost/dbtcc', './backup').backup();
    req.flash('success_msg', 'Cópia de segurança enviada!');
    res.redirect('/admin_panel/backup')
})

router.post("/backup/upload/", isAdmin, (req, res) => {
    let backup = req.files.backup.tempFilePath;
    new Restore ('mongodb://localhost/dbtcc', backup, true).restore();
    req.flash('success_msg', 'Cópia de segurança aplicada!');
    res.redirect('/admin_panel/backup')
})

module.exports = router;

