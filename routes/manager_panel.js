// Require 
    // módulos
    const mongoose = require('mongoose');
    const express = require('express');
    const slugify = require('slugify')
    const fs = require('fs');
    const qr = require('qr-image');
    const router = express.Router();
    require("../models/Page")
    require("../models/Log")
// Model
    const Page = mongoose.model('pages');
    const Log = mongoose.model('logs');

// Helpers
    const {isManager} = require('../helpers/privilege')

// Erros

// manager panel index
router.get("/", isManager, (req, res) => {
    res.render("manager_panel/index")
})

// manage pages
router.get("/managepage", isManager, (req, res) => {
    Page.find().then((pages) => {
        res.render("manager_panel/managepage", {pages: pages})
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao listar as páginas')
        console.log("erro ao listar as páginas: " + err)
    })
})

// add pages
router.get("/managepage/add", isManager, (req, res) => {
    res.render("manager_panel/managepageadd")
})


router.post("/managepage/new", isManager, (req, res) => {
    const newPage = {
        title: req.body.title,
        slug: slugify(req.body.title),
        image: slugify(req.body.title),
        content: req.body.content,
        author: req.user.name
    }

    const newLog = {
        name: req.user.name,
        action: "Postagem com nome: '" + req.body.title + "' criada pelo usuário " + req.user.name
    }

    new Log(newLog).save().catch((err) => {
        console.log("erro ao aplicar log: "+err)
    })


    console.log(req.user.userName)
    var code = qr.image('http://' + req.get('host') + '/page/' + slugify(req.body.title), { type: 'png', ec_level: 'M', size: 5, margin: 4})
    res.setHeader('Content-type', 'image/png');
    var output = fs.createWriteStream(__dirname + '/../public/img/' + slugify(req.body.title) + '.png')
    code.pipe(output)

    new Page(newPage).save().then(() => {
        req.flash('success_msg', 'Página criada com sucesso!')
        res.redirect("/manager_panel/managepage")
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao criar a página.')
        console.log("erro ao criar pagina :( " + err)
    })
})

// edit pages
router.get("/managepage/edit/:id", isManager, (req, res) => {
    Page.findOne({_id: req.params.id}).then((page) => {
        res.render("manager_panel/managepageedit", {page: page})
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao editar a página')
        console.log("erro ao editar a página: " + err)
        res.redirect("manager_panel/managepage")
    })
})

router.post("/managepage/edit", isManager, (req, res) => {
    Page.findOne({_id: req.body.id}).then((page) => {
        page.title = req.body.title
        page.slug = slugify(req.body.title)
        page.content = req.body.content

        fs.unlinkSync(__dirname + '/../public/img/' + page.image + '.png')
        
        const newLog = {
            name: req.user.name,
            action: "Postagem com nome: '" + req.body.title + "' editada pelo usuário " + req.user.name
        }
    
        new Log(newLog).save().catch((err) => {
            console.log("erro ao aplicar log: "+err)
        })


        res.setHeader('Content-type', 'image/png');
        var code = qr.image('http://' + req.get('host') + '/page/' + slugify(req.body.title), { type: 'png', ec_level: 'M', size: 5, margin: 4})
        var output = fs.createWriteStream(__dirname + '/../public/img/' + slugify(req.body.title) + '.png')
        code.pipe(output)

        page.image = slugify(req.body.title)

        page.save().then(() => {
        res.redirect("/manager_panel/managepage")
        })
    }).catch((err) => {
        console.log("erro ao editar: " + err)
    })
})

router.get("/managepage/edit/:id/download", isManager, (req, res) => {
    Page.findOne({_id: req.params.id}).then((page) => {
        const file = (__dirname + '/../public/img/' + page.image + '.png');
        req.flash('success_msg', 'Página editada com sucesso!')
        res.download(file);
    }).catch((err) => {
        req.flash('error_msg', 'Falha ao fazer download da imagem.')
        console.log("erro ao baixar a imagem: " + err)
        res.redirect("manager_panel/managepage")
    })
})

// delete page
router.post("/managepage/delete", isManager, (req, res) => {
    Page.deleteOne({_id: req.body.id}).then(() => {
        fs.unlinkSync(__dirname + '/../public/img/' + req.body.image + '.png')
        req.flash('success_msg','Página deletada com sucesso!')

        const newLog = {
            name: req.user.name,
            action: "Postagem com nome: '" + req.body.title + "' apagada pelo usuário " + req.user.name
        }
    
        new Log(newLog).save().catch((err) => {
            console.log("erro ao aplicar log: "+err)
        })

        res.redirect("/manager_panel/managepage")
    })


})

module.exports = router;