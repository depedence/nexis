package nexis.ru.service;

import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import nexis.ru.entity.Page;
import nexis.ru.entity.dto.PageDto;
import nexis.ru.entity.request.CreatePageRequest;
import nexis.ru.entity.request.UpdatePageRequest;
import nexis.ru.mapper.PageMapper;
import nexis.ru.repository.PageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PageService {

    private final PageRepository pageRepository;
    private final PageMapper pageMapper;

    public PageDto createPage(CreatePageRequest request) {
        PageDto pageDto = new PageDto();

        pageDto.setParentId(request.getParentId());
        pageDto.setTitle(request.getTitle());
        pageDto.setContent(request.getContent());
        pageDto.setPosition(request.getPosition());
        pageDto.setCreatedAt(LocalDateTime.now());
        pageDto.setUpdatedAt(LocalDateTime.now());

        Page savedPage = pageRepository.save(pageMapper.toEntity(pageDto));
        return pageMapper.toDto(savedPage);
    }

    public List<PageDto> getPages() {
        List<Page> pages = pageRepository.findAll();

        return pages.stream()
                .map(pageMapper::toDto)
                .toList();
    }

    public PageDto getPageById(Long id) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        return pageMapper.toDto(page);
    }

    public PageDto updatePage(Long id, UpdatePageRequest request) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));

        page.setTitle(request.getTitle());
        page.setContent(request.getContent());
        page.setUpdatedAt(LocalDateTime.now());

        Page savedPage = pageRepository.save(page);
        return pageMapper.toDto(savedPage);
    }

    @Transactional
    public void deletePage(Long id) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Page not found"));
        pageRepository.delete(page);
    }

    public List<PageDto> searchPages(String query) {
        List<Page> pages = pageRepository
        .findByTitleContainingIgnoreCaseOrContentContainingIgnoreCase(query, query);

        return pages.stream()
            .map(pageMapper::toDto)
            .toList();
    }
}
