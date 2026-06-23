const loginController = async (req, res) => {
    try {
        const { username, password } = req.body;
        if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
            return res.status(200).json({ success: true, message: "Login successful" });
        } else {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
};

module.exports = { loginController };