const vendor = (req, res, next) => {
    if (req.user && (req.user.role === "vendor" || req.user.role === "admin")) {
        return next()
    }
    return res.staus(403).json({
        message: "Not authorized as vendor"
    })
}

export default vendor