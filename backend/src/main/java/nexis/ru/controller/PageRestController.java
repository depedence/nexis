package nexis.ru.controller;

import lombok.RequiredArgsConstructor;
import nexis.ru.entity.dto.PageDto;
import nexis.ru.entity.request.CreatePageRequest;
import nexis.ru.service.PageService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
public class PageRestController {

    private final PageService pageService;

    @PostMapping
    public PageDto createPage(@RequestBody CreatePageRequest request) {
        return pageService.createPage(request);
    }

}