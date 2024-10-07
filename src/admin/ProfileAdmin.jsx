import React, { useEffect, useRef, useState } from "react";
import {
    Container,
    Row,
    Col,
    Button,
    Form,
    Spinner,
    Alert,
} from "react-bootstrap";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Key,
    Bell,
    Globe,
    Moon,
    LogOut,
    ChevronRight,
    EyeOff,
    Eye,
} from "lucide-react";
import "../styles/Profile.css";
import { auth, db, storage } from "../firebase.config";
import { toast } from "react-toastify";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    signOut,
} from "firebase/auth";
import { useTheme } from "../components/UI/ThemeContext";
import { useNavigate } from "react-router-dom";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import useAdmin from "../custom-hooks/useAdmin";

const ProfileAdmin = () => {
    const [editing, setEditing] = useState(false);
    const inputFileRef = useRef(null);

    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);

    const { isAdmin, isLoading } = useAdmin();
    const [isAvatarUpLoading, setIsAvatarUpLoading] = useState(false);
    const [activeSection, setActiveSection] = useState(null);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();
    //Set information for admin
    const [adminInfo, setAdminInfo] = useState({
        displayName: "",
        birthDate: "",
        email: "",
        phone: "",
        address: "",
        role: "",
        photoURL: "",
    });

    // Store original admin info for reset
    const [originalAdminInfo, setOriginalAdminInfo] = useState({
        ...adminInfo,
    });

    // Get admin data from firebase
    useEffect(() => {
        const fetchAdminData = async (user) => {
            setIsDataLoading(true);
            setIsEmpty(false);
            try {
                if (user) {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const newAdminInfo = {
                            displayName: userData.displayName || "",
                            birthDate: userData.birthDate
                                ? new Date(userData.birthDate.toDate())
                                      .toISOString()
                                      .split("T")[0]
                                : "",
                            email: userData.email || user.email,
                            phone: userData.phone || "",
                            address: userData.address || "",
                            role: userData.role || "admin",
                            photoURL: userData.photoURL || "",
                        };
                        setAdminInfo(newAdminInfo);
                        setOriginalAdminInfo(newAdminInfo);

                        if (Object.keys(userData).length === 0) {
                            setIsEmpty(true);
                        }
                    } else {
                        toast.error("User not found");
                    }
                } else {
                    toast.error("User document not found in Firestore!");
                }
            } catch (error) {
                toast.error("Fetch failed for user: " + error.message);
            } finally {
                setIsDataLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchAdminData(user);
            } else {
                toast.error("User not found!");
            }
        });

        return () => unsubscribe();
    }, []);

    // Handle Edit profile admin
    const handleEditProfile = async () => {
        const user = auth.currentUser;
        if (user) {
            const userDocRef = doc(db, "users", user.uid);

            try {
                await updateDoc(userDocRef, {
                    displayName: adminInfo.displayName,
                    birthDate: new Date(adminInfo.birthDate),
                    phone: adminInfo.phone,
                    address: adminInfo.address,
                });

                toast.success("Profile updated successfully!");
                setEditing(false);
            } catch (error) {
                toast.error("Failed to update profile: " + error.message);
            }
        }
    };

    // Handle Input change when user changes their information
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setAdminInfo((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Cancel edit and revert changes
    const handleCancelEdit = () => {
        // Revert to original info
        setAdminInfo(originalAdminInfo);
        setEditing(false);
    };

    // Handle Change Password
    const handleChangePassword = async (e) => {
        e.preventDefault();

        const currentPassword = e.target.currentPassword.value;
        const newPassword = e.target.newPassword.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!");
            return;
        }

        try {
            const user = auth.currentUser;
            if (!user) {
                toast.error("No authenticated user found!");
                return;
            }

            // Create credential to re-authenticate user
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );
            // Re-authenticate user with the credential
            await reauthenticateWithCredential(user, credential);

            // Update new password
            await updatePassword(user, newPassword);
            toast.success("Password updated successfully!");

            // Reset input fields after successful password change
            e.target.reset();
        } catch (error) {
            if (error.code === "auth/wrong-password") {
                toast.error("Incorrect current password. Please try again.");
            } else if (error.code === "auth/invalid-credential") {
                toast.error("Invalid credentials. Please check your input.");
            } else {
                toast.error("Failed to change password: " + error.message);
            }
        }
    };

    // Handle Toggle Dark Mode
    const handleDarkModeToggle = () => {
        toggleDarkMode();
    };

    const handleLogOut = () => {
        signOut(auth)
            .then(() => {
                toast.success("Logged out");
            })
            .catch((error) => {
                toast.error(error.message);
            });
        navigate("/login");
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setIsAvatarUpLoading(true);
            // Update temporary image in UI
            const reader = new FileReader();
            reader.onloadend = () => {
                setAdminInfo((prev) => ({ ...prev, photoURL: reader.result }));
            };
            reader.readAsDataURL(file);

            // Upload image to Firebase Storage
            const avatarRef = ref(storage, `avatars/${auth.currentUser.uid}`);

            try {
                await uploadBytes(avatarRef, file); // Upload file
                const downloadURL = await getDownloadURL(avatarRef);

                // Update photoURL in Firebase Storage
                const userDocRef = doc(db, "users", auth.currentUser.uid);
                await updateDoc(userDocRef, { photoURL: downloadURL });

                toast.success("Avatar uploaded successfully!");
            } catch (error) {
                toast.error("Failed to upload avatar: " + error.message);
            } finally {
                setIsAvatarUpLoading(false);
            }
        }
    };

    const handleAvatarClick = () => {
        if (editing) {
            inputFileRef.current.click();
        } else {
            toast.info("You need to be in Edit mode to upload");
        }
    };

    // Render profile admin
    const renderPersonalInfo = () => (
        <div className="personal-info">
            <h3>Personal Information</h3>
            <div className="info-item">
                <User size={18} />
                <span>
                    <strong>Name:</strong>
                    {editing ? (
                        <input
                            type="text"
                            name="displayName"
                            value={adminInfo.displayName}
                            onChange={handleInputChange}
                        />
                    ) : (
                        adminInfo.displayName || "Not Provided"
                    )}
                </span>
            </div>
            <div className="info-item">
                <Calendar size={18} />
                <span>
                    <strong>Date of Birth:</strong>{" "}
                    {editing ? (
                        <input
                            type="date"
                            name="birthDate"
                            value={adminInfo.birthDate}
                            onChange={handleInputChange}
                        />
                    ) : (
                        adminInfo.birthDate || "Not Provided"
                    )}
                </span>
            </div>
            <div className="info-item">
                <Mail size={18} />
                <span>
                    <strong>Email:</strong> {adminInfo.email}
                </span>
            </div>
            <div className="info-item">
                <Phone size={18} />
                <span>
                    <strong>Phone:</strong>
                    {editing ? (
                        <input
                            type="text"
                            name="phone"
                            value={adminInfo.phone}
                            onChange={handleInputChange}
                        />
                    ) : (
                        adminInfo.phone || "Not Provided"
                    )}
                </span>
            </div>
            <div className="info-item last">
                <MapPin size={18} />
                <span>
                    <strong>Address:</strong>
                    {editing ? (
                        <input
                            type="text"
                            name="address"
                            value={adminInfo.address}
                            onChange={handleInputChange}
                        />
                    ) : (
                        adminInfo.address || "Not Provided"
                    )}
                </span>
            </div>
            <Button
                variant="primary"
                className="edit-profile-button"
                onClick={() => {
                    editing ? handleEditProfile() : setEditing(true);
                }}
            >
                {editing ? "Save changes" : "Edit Profile"}
            </Button>
            {editing && (
                <Button
                    variant="secondary"
                    className="cancel-edit-button"
                    onClick={handleCancelEdit}
                >
                    Back
                </Button>
            )}
        </div>
    );

    // Render Change Password
    const renderChangePasswordAdmin = () => (
        <div className="change-password">
            <h3>Change Password</h3>
            <p>
                For your account's security, do not share your password with
                anyone else.
            </p>
            <form
                className="change-password-form"
                onSubmit={handleChangePassword}
            >
                <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="currentPassword"
                            className="form-control"
                            placeholder="Enter current password"
                            required
                        />
                        <span
                            className="toggle-password-visibility"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </span>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="newPassword"
                            className="form-control"
                            placeholder="Enter new password"
                            required
                        />
                        <span
                            className="toggle-password-visibility"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </span>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="confirmPassword">
                        Confirm New Password
                    </label>
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            id="confirmPassword"
                            className="form-control"
                            placeholder="Re-enter new password"
                            required
                        />
                        <span
                            className="toggle-password-visibility"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff /> : <Eye />}
                        </span>
                    </div>
                </div>
                <Button
                    type="submit"
                    variant="primary"
                    className="change-password-button"
                >
                    Save Changes
                </Button>
            </form>
        </div>
    );

    // Render Dark Mode
    const renderDarkMode = () => (
        <div>
            <h3>Display Settings</h3>
            <p>Toggle between light and dark mode for the admin panel.</p>
            <Form.Check
                type="switch"
                id="dark-mode-switch"
                label="Dark Mode"
                checked={isDarkMode}
                onChange={handleDarkModeToggle}
                className="dark-mode-toggle"
            />
        </div>
    );

    // Render LogOut information
    const renderLogOut = () => (
        <div>
            <h3>Logout</h3>
            <p>Are you sure you want to log out of the user profile?</p>
            <Button variant="danger" className="mt-3" onClick={handleLogOut}>
                Logout
            </Button>
        </div>
    );

    const menuItems = [
        {
            icon: <User size={20} />,
            text: "Personal Information",
            content: renderPersonalInfo(),
        },
        {
            icon: <Key size={20} />,
            text: "Change Password",
            content: renderChangePasswordAdmin(),
        },
        {
            icon: <Bell size={20} />,
            text: "Notifications",
            content: (
                <div>
                    <h3>Notification Settings</h3>
                    <p>Manage your email and push notification preferences.</p>
                </div>
            ),
        },
        {
            icon: <Globe size={20} />,
            text: "Language",
            content: (
                <div>
                    <h3>Language Preferences</h3>
                    <p>
                        Select your preferred language for the admin interface.
                    </p>
                </div>
            ),
        },
        {
            icon: <Moon size={20} />,
            text: "Dark Mode",
            content: renderDarkMode(),
        },
        {
            icon: <LogOut size={20} />,
            text: "Logout",
            content: renderLogOut(),
        },
    ];

    if (isEmpty) {
        return (
            <Alert variant="info">
                No user data available. Please update your profile.
            </Alert>
        );
    }

    if (isLoading || isDataLoading) {
        return (
            <Container
                className="d-flex justify-content-center align-items-center"
                style={{ height: "100vh" }}
            >
                <Spinner style={{ width: '3rem', height: '3rem' }} />
                <span className="visually-hidden">Loading...</span>
            </Container>
        );
    }

    if (!isAdmin) {
        toast.error("Admin only!");
    }

    return (
        <Container
            fluid
            className={`profile__personal ${
                isDarkMode ? "dark-mode" : "light-mode"
            }`}
        >
            <Row>
                <Col md={12} className="sidebar">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            <img
                                src={
                                    adminInfo.photoURL ||
                                    "https://via.placeholder.com/150"
                                }
                                alt="Admin Avatar"
                                onClick={handleAvatarClick}
                                style={{
                                    cursor: editing ? "pointer" : "default",
                                    opacity: isAvatarUpLoading ? 0.5 : 1,
                                }}
                            />
                            {editing && (
                                <>
                                    <input
                                        type="file"
                                        ref={inputFileRef}
                                        accept="image/*"
                                        style={{ display: "none" }}
                                        onChange={handleAvatarChange}
                                    />
                                    <div className="avatar-edit-overlay">
                                        {isAvatarUpLoading
                                            ? "Uploading..."
                                            : "Click to change your avatar"}
                                    </div>
                                </>
                            )}

                            {isAvatarUpLoading && (
                                <div className="avatar-loading-overlay">
                                    <Spinner animation="border" size="sm" />
                                </div>
                            )}
                        </div>
                        <h1 className="profile-name">
                            {adminInfo.displayName}
                        </h1>
                        <p className="profile-role">{adminInfo.role}</p>
                    </div>

                    <div className="sidebar-content">
                        <div className="menu-section">
                            <h2>Account Settings</h2>
                            {menuItems.map((item, index) => (
                                <div
                                    key={index}
                                    className={`menu-item ${
                                        activeSection === index ? "active" : ""
                                    }`}
                                    onClick={() => setActiveSection(index)}
                                >
                                    {item.icon}
                                    <span>{item.text}</span>
                                    <ChevronRight size={20} />
                                </div>
                            ))}
                        </div>

                        <div className="main-content">
                            {activeSection !== null && (
                                <div className="content-area">
                                    {menuItems[activeSection].content}
                                </div>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default ProfileAdmin;
