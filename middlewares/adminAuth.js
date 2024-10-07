function authenticateLogin(req, res, next){
    if(req.session.user  != undefined){
        next();
    }else{
        res.redirect("/login")
    }
}

function authenticateADM(req, res, next){
    if(req.session.user && req.session.user.roles != undefined){
        if(req.session.user.roles == "lowuser"){
            res.redirect("/login")
        } else {
            next();
        }
    } else {
        res.redirect("/login")
    }
}

function authenticateLowUser(req, res, next){
    if(req.session.user && req.session.user.roles != undefined){
        if(req.session.user.roles == "admin"){
            res.redirect("/login")
        } else {
            next();
        }
    } else {
        res.redirect("/login")
    }
}


module.exports = {
    authenticateLogin,
    authenticateADM,
    authenticateLowUser
}