package nexis.ru.mapper;

import javax.annotation.processing.Generated;
import nexis.ru.entity.Page;
import nexis.ru.entity.dto.PageDto;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-27T16:52:35+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class PageMapperImpl implements PageMapper {

    @Override
    public PageDto toDto(Page page) {
        if ( page == null ) {
            return null;
        }

        PageDto pageDto = new PageDto();

        pageDto.setCreatedAt( page.getCreatedAt() );
        pageDto.setId( page.getId() );
        pageDto.setParentId( page.getParentId() );
        pageDto.setPosition( page.getPosition() );
        pageDto.setTitle( page.getTitle() );
        pageDto.setUpdatedAt( page.getUpdatedAt() );

        return pageDto;
    }

    @Override
    public Page toEntity(PageDto pageDto) {
        if ( pageDto == null ) {
            return null;
        }

        Page page = new Page();

        page.setCreatedAt( pageDto.getCreatedAt() );
        page.setId( pageDto.getId() );
        page.setParentId( pageDto.getParentId() );
        page.setPosition( pageDto.getPosition() );
        page.setTitle( pageDto.getTitle() );
        page.setUpdatedAt( pageDto.getUpdatedAt() );

        return page;
    }
}
