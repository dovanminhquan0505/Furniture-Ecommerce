import React from "react";
import "../styles/cart.css";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import { Container, Row, Col } from "reactstrap";
import { motion } from "framer-motion";
import { cartActions } from "../redux/slices/cartSlice";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Cart = () => {
    const cartItems = useSelector((state) => state.cart.cartItems);
    const totalAmount = useSelector((state) => state.cart.totalAmount);

    const navigate = useNavigate();

    // Handle checkout if cart is empty
    const handleCheckout = () => {
        if (cartItems.length === 0) {
            toast.error("Your cart is empty. Please buy something!");
        } else {
            navigate("/checkout");
        }
    };

    return (
        <Helmet title=" Cart">
            <CommonSection title="Shopping Cart" />
            <section>
                <Container>
                    <Row>
                        <Col lg="9">
                            {cartItems.length === 0 ? (
                                <h2 className="fs-4 text-center">
                                    No Product added to Cart
                                </h2>
                            ) : (
                                <table className="table bordered">
                                    <thead>
                                        <tr>
                                            <th>Image</th>
                                            <th>Title</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Delete</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {cartItems.map((item, index) => (
                                            <Tr item={item} key={index} />
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </Col>

                        <Col lg="3">
                            <div>
                                <h6 className="d-flex align-items-center justify-content-between">
                                    Subtotal
                                    <span className="fs-4 fw-bold">
                                        ${totalAmount}
                                    </span>
                                </h6>
                            </div>
                            <p className="fs-6 mt-2">
                                Taxes and shipping will calculate in checkout
                            </p>
                            <div>
                                <button
                                    className="buy__btn w-100"
                                    onClick={handleCheckout}
                                >
                                    Checkout
                                </button>

                                <button className="buy__btn w-100 mt-3">
                                    <Link to="/shop">Continue Shopping</Link>
                                </button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

const Tr = ({ item }) => {
    const dispatch = useDispatch();

    const deleteProduct = () => {
        dispatch(cartActions.deleteItemFromCart(item.id));
    };
    return (
        <tr>
            <td>
                <img src={item.imgUrl} alt="" />
            </td>
            <td>{item.productName}</td>
            <td>{item.category}</td>
            <td>${item.price}</td>
            <td>{item.quantity}</td>
            <td>
                <motion.i
                    whileTap={{
                        scale: 1.2,
                    }}
                    onClick={deleteProduct}
                    class="ri-delete-bin-line"
                ></motion.i>
            </td>
        </tr>
    );
};

export default Cart;
