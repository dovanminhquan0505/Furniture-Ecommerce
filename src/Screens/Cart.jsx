import React from "react";
import "../styles/cart.css";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/UI/CommonSection";
import { Container, Row, Col } from "reactstrap";
import { motion } from "framer-motion";
import { cartActions } from "../redux/slices/cartSlice";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";

const Cart = () => {
    const cartItems = useSelector((state) => state.cart.cartItems);
    const totalAmount = useSelector((state) => state.cart.totalAmount);

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
                                            <th>Price</th>
                                            <th>Qty</th>
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
                                <h6>Subtotal</h6>
                                <span>${totalAmount}</span>
                            </div>
                            <p>Taxes and shipping will calculate in checkout</p>
                            <div>
                                <div className="buy__btn"><Link to="/shop">Continue Shopping</Link></div>
                                <div className="buy__btn"><Link to="/checkout">Checkout</Link></div>
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
