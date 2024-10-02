import "./common.css";
import AuthWrapper from "./components/AuthWrapper/AuthWrapper";
import Layout from "./components/Layout/Layout";

function App() {
    return (
        <AuthWrapper>
            <Layout />
        </AuthWrapper>
    );
}

export default App;
