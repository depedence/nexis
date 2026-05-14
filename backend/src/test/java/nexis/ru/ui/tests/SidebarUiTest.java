package nexis.ru.ui.tests;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;

import nexis.ru.infra.ui.BaseUiTest;
import nexis.ru.ui.page.PagesPage;

@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class SidebarUiTest extends BaseUiTest {

    @BeforeEach
    void setup() {
        loginViaApi(TEST_USER, TEST_PASSWORD);
    }

    @Test
    @Order(1)
    void user_can_logout() {
        new PagesPage()
                .openPage()
                .logoutClick()
                .authBtnIsVisible();
    }
}
