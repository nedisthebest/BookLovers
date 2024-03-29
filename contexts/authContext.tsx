import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';


type AuthContextData = {
    authData?: AuthData;
    loading: boolean;
    signIn(email: string, password: string): Promise<boolean>;
    signOut(): Promise<void>;
    signUp(submit: { email: string; password: string; fname: string; sname: string; pcode: string; }): Promise<boolean>;
};

type AuthData = {
    token: string;
    firstname: string;
    lastname: string;
    userid: string;
};
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

const AuthProvider: React.FC = ({ children }: any) => {
    const [authData, setAuthData] = useState<AuthData>();

    //the AuthContext start with loading equals true
    //and stay like this, until the data be load from Async Storage
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //Every time the App is opened, this provider is rendered
        //and call de loadStorage function.
        loadStorageData();
    }, []);

    async function loadStorageData(): Promise<void> {
        try {
            //Try get the data from Async Storage
            const authDataSerialized = await AsyncStorage.getItem('@AuthData');
            if (authDataSerialized) {
                //If there are data, it's converted to an Object and the state is updated.
                const _authData: AuthData = JSON.parse(authDataSerialized);
                setAuthData(_authData);
            }
        } catch (error) {
        } finally {
            //loading finished
            setLoading(false);
        }
    }

    const signIn = async (email: string, password: string) => {

        const _authData = await authService.signIn(email, password);

        if (_authData === false) return false;

        //Set the data in the context, so the App can be notified
        //and send the user to the AuthStack
        setAuthData(_authData);

        AsyncStorage.setItem('@AuthData', JSON.stringify(_authData));

        return true;
    };

    const signUp = async (submit: { email: string, password: string, fname: string, sname: string, pcode: string }) => {
        await authService.signUp(submit);

        return(signIn(submit.email, submit.password));
    };

    const signOut = async () => {
        //Remove data from context, so the App can be notified
        //and send the user to the AuthStack
        if (!authData) return;
        const success = await authService.signOut(authData.token, authData.userid);

        if (!success) return;

        setAuthData(undefined);

        await AsyncStorage.removeItem('@AuthData');
    };

    return (
        //This component will be used to encapsulate the whole App,
        //so all components will have access to the Context
        <AuthContext.Provider value={{ authData, loading, signIn, signOut, signUp }}>
            {children}
        </AuthContext.Provider>
    );
};

function useAuth(): AuthContextData {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}

export { AuthContext, AuthProvider, useAuth };
