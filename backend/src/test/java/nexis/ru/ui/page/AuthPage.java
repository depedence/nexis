package nexis.ru.ui.page;

import java.time.Duration;

import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import com.codeborne.selenide.Condition;
import com.codeborne.selenide.WebDriverRunner;

public class AuthPage extends BasePage {

    public AuthPage openRegister() {
        open("/register");
        return this;
    }

    public AuthPage openLogin() {
        open("/login");
        return this;
    }

    public AuthPage authBtnIsVisible() {
        byTest("auth-btn").shouldBe(Condition.visible);
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

    public AuthPage formErrorIsVisible() {
        byTest("form-error").shouldBe(Condition.visible);
        return this;
    }

    public AuthPage shouldBeRedirectTo(String path) {
        new WebDriverWait(WebDriverRunner.getWebDriver(), Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains(path));
        return this;
    }
}
