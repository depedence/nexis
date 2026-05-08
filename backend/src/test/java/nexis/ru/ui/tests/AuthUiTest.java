package nexis.ru.ui.tests;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import nexis.ru.infra.ui.BaseUiTest;
import nexis.ru.ui.page.AuthPage;

public class AuthUiTest extends BaseUiTest {

    private String random = UUID.randomUUID().toString().substring(0, 4);
    private String username = "username_" + random;
    private String password = "password_" + random;

    @Test
    void user_can_register__valid() {
        new AuthPage()
                .openRegister()
                .fillInputs(username, password, true)
                .clickAuthBtn();
    }

    @Test
    void user_can_login__valid() {
        new AuthPage()
                .openLogin()
                .fillInputs(username, password, false)
                .clickAuthBtn();
    }

    @Test
    void user_cant_login__invalid() {

        // остановился тут
        new AuthPage()
                .openLogin()
                .fillInputs("invalidUsername", "invalidPassword", false)
                .clickAuthBtn()
                .formErrorIsVisible();
    }
}
