const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
    let token = null;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        if (req.accepts("html")) {
            return res.redirect("/login.html");
        }
        return res.status(401).json({ error: "Access denied. Please log in." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "gradelift_production_jwt_secret_key_2026");
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userName = decoded.name;
        next();
    } catch (err) {
        if (req.accepts("html")) {
            return res.redirect("/login.html");
        }
        return res.status(401).json({ error: "Invalid session or token expired." });
    }
};
