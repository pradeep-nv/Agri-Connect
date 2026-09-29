import User from '../models/auth.model.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Strict Email Regex (RFC 5322 standard check)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const signup = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        // 1. Ensure all fields are provided
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "All fields (name, email, password, role) are required" });
        }

        const trimmedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        // 2. Validate Name length
        if (trimmedName.length < 2) {
            return res.status(400).json({ message: "Name must be at least 2 characters long" });
        }

        // 3. Validate Email format via Regex
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ 
                message: "Please provide a valid email address (e.g. user@example.com)" 
            });
        }

        // 4. Validate Role
        if (!['farmer', 'expert'].includes(role)) {
            return res.status(400).json({ message: "Role must be either 'farmer' or 'expert'" });
        }

        // 5. Validate Password strength
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }

        // 6. Check if user already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "An account with this email already exists" });
        }

        // 7. Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // 8. Create new user
        const newUser = await User.create({ 
            name: trimmedName, 
            email: normalizedEmail, 
            password: hashedPassword, 
            role 
        });

        // 9. Generate JWT token
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_KEY,
            { expiresIn: "10h" }
        );

        // 10. Set token in cookie and send response
        return res
            .cookie('token', token, { httpOnly: false, secure: false, sameSite: 'lax' })
            .status(201)
            .json({ 
                message: "User registered successfully", 
                token, 
                role: newUser.role, 
                userId: newUser._id 
            });
    } catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ message: "Something went wrong during registration" });
    }
};

export const signin = async (req, res) => {
    const { email, password, role } = req.body;
    try {
        if (!email || !password || !role) {
            return res.status(400).json({ message: "Email, password and role are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Validate Email format
        if (!EMAIL_REGEX.test(normalizedEmail)) {
            return res.status(400).json({ message: "Please provide a valid email address format" });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(404).json({ message: "User not found with this email" });
        
        if (role !== user.role) {
            return res.status(403).json({ message: `Access denied. Registered account is not a ${role}` });
        }
        
        // Validate password
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid password credentials" });

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_KEY,
            { expiresIn: "10h" }
        );

        // Set token in cookie
        return res
            .cookie('token', token, { httpOnly: false, secure: false, sameSite: 'lax' })
            .status(200)
            .json({ message: "Logged in successfully", token, role: user.role, userId: user._id });
    } catch (err) {
        console.error("Signin error:", err);
        return res.status(500).json({ message: "Something went wrong during signin" });
    }
};

export const signout = async (req, res) => {
    // Clear the cookie on logout
    res.clearCookie('token', { httpOnly: false, secure: false, sameSite: 'lax' });
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logged out successfully' });
};

export const getUserProfile = async (req, res) => {
    try {
        // Retrieve user profile excluding the password
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Internal server error" });
    }
};
