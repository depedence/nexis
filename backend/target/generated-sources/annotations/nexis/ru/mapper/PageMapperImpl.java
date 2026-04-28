package nexis.ru.mapper;

import javax.annotation.processing.Generated;
import nexis.ru.entity.Page;
import nexis.ru.entity.dto.PageDto;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-28T11:28:58+0300",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 17.0.16 (Microsoft)"
)
@Component
public class PageMapperImpl implements PageMapper {

    @Override
    public PageDto toDto(Page page) {
        if ( page == null ) {
            return null;
        }

        PageDto pageDto = new PageDto();

        pageDto.setId( page.getId() );
        pageDto.setParentId( page.getParentId() );
        pageDto.setTitle( page.getTitle() );
        pageDto.setPosition( page.getPosition() );
        pageDto.setCreatedAt( page.getCreatedAt() );
        pageDto.setUpdatedAt( page.getUpdatedAt() );

        return pageDto;
    }

    @Override
    public Page toEntity(PageDto pageDto) {
        if ( pageDto == null ) {
            return null;
        }

        Page page = new Page();

        page.setId( pageDto.getId() );
        page.setParentId( pageDto.getParentId() );
        page.setTitle( pageDto.getTitle() );
        page.setPosition( pageDto.getPosition() );
        page.setCreatedAt( pageDto.getCreatedAt() );
        page.setUpdatedAt( pageDto.getUpdatedAt() );

        return page;
    }
}
