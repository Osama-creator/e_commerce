const jwt = require('jsonwebtoken');

module.exports = async (user) => {
    const token = jwt.sign(
        {
            user_id: user.id?.toString(),
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET_KEY,
        { expiresIn: '1h' } 
    );

    return token;
}
