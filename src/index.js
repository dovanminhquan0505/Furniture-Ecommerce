import React from "react";
import ReactDOM from "react-dom/client";
import "remixicon/fonts/remixicon.css";
import "bootstrap/dist/css/bootstrap.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import store from "./redux/store";
import { Provider } from "react-redux";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider } from "./components/UI/ThemeContext";
import { ProductProvider } from "./contexts/ProductContext";

// Use App into Provider, so that all child components inside App will have access to Redux store via connect or useSelector,
// useDispatch hooks of react-redux.
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <Provider store={store}>
                <ThemeProvider>
                    <ProductProvider>
                        <ToastContainer
                            theme="dark"
                            position="top-right"
                            autoClose={3000}
                            closeOnClick
                            pauseOnHover
                        />
                        <App />
                    </ProductProvider>
                </ThemeProvider>
            </Provider>
        </BrowserRouter>
    </React.StrictMode>
);
