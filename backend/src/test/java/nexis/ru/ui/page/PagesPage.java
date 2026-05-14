package nexis.ru.ui.page;

public class PagesPage extends BasePage {

    public PagesPage openPage() {
        open("/pages");
        return this;
    }

    public AuthPage logoutClick() {
        byTest("logout-btn").click();
        return new AuthPage();
    }
}
