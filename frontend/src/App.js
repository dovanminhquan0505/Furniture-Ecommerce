import { Provider } from "react-redux";
import "./common.css";
import AuthWrapper from "./components/AuthWrapper/AuthWrapper";
import Layout from "./components/Layout/Layout";
import store, { persistor } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";

function App() {
    return (
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <AuthWrapper>
                    <Layout />
                </AuthWrapper>
            </PersistGate>
        </Provider>
    );
}

export default App;
