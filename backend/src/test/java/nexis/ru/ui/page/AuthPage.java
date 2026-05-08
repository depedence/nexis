package nexis.ru.ui.page;

public class AuthPage extends BasePage {

    public AuthPage openRegister() {
        open("/register");
        return this;
    }

    public AuthPage openLogin() {
        open("/login");
        return this;
    }

    public AuthPage fillInputs(String username, String password, boolean register) {
        byTest("username-input").setValue(username);
        byTest("password-input").setValue(password);
        if (register) {
            byTest("confirm-password-input").setValue(password);
        }
        return this;
    }

    public AuthPage clickAuthBtn() {
        byTest("auth-btn").click();
        return this;
    }

    public boolean formErrorIsVisible() {
        return byTest("form-error").isDisplayed();
    }
}
