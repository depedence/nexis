package nexis.ru.ui.page;

import com.codeborne.selenide.ElementsCollection;
import com.codeborne.selenide.Selenide;
import com.codeborne.selenide.SelenideElement;

public abstract class BasePage {

    protected void open(String path) {
        Selenide.open(path);
    }

    protected SelenideElement $(String locator) {
        return Selenide.$(locator);
    }

    protected ElementsCollection $$(String locator) {
        return Selenide.$$(locator);
    }

    protected SelenideElement byTest(String testId) {
        return $("[data-testid='" + testId + "']");
    }
}
