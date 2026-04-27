package nexis.ru.service;

import lombok.RequiredArgsConstructor;
import nexis.ru.entity.Page;
import nexis.ru.entity.dto.PageDto;
import nexis.ru.entity.request.CreatePageRequest;
import nexis.ru.mapper.PageMapper;
import nexis.ru.repository.PageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PageService {

    private final PageRepository pageRepository;
    private final PageMapper pageMapper;

    public PageDto createPage(CreatePageRequest request) {
        PageDto pageDto = new PageDto();

        pageDto.setParentId(request.getParentId());
        pageDto.setTitle(request.getTitle());
        pageDto.setPosition(request.getPosition());
        pageDto.setCreatedAt(LocalDateTime.now());
        pageDto.setUpdatedAt(LocalDateTime.now());

        Page savedPage = pageRepository.save(pageMapper.toEntity(pageDto));
        return pageMapper.toDto(savedPage);
    }

}