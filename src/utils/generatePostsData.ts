import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { PostMetadata } from '../types';
import { toPostSlug } from './postSlug';

// Markdown File Path
const MARKDOWN_DIRECTORY_PATH = 'public/_posts';
const postsDirectory = path.join(process.cwd(), MARKDOWN_DIRECTORY_PATH);

// image directory path
const IMAGE_DIRECTORY_PATH = 'public/images/posts';
const imageDirectory = path.join(process.cwd(), IMAGE_DIRECTORY_PATH);

// Create posts data path
const jsonOutputPath = path.join(process.cwd(), 'public/posts-data.json');

/** 분당 읽는 글자 수(공백 제외). 한국어 기술 문서 기준값입니다 */
const CHARACTERS_PER_MINUTE = 500;

/**
 * 읽기 시간(분) — docs/handoff-step4-list.md §5-1.
 *
 * 코드블록과 이미지를 먼저 걷어냅니다. 둘 다 "읽는" 대상이 아니라서 그대로
 * 세면 코드가 긴 글의 읽기 시간이 실제보다 몇 배로 부풀려집니다.
 * 최소값은 1 분입니다 — `0분` 은 표시할 수 없는 값입니다.
 */
function calculateReadingMinutes(content: string): number {
    const characters = content
        /* 펜스 코드블록. 닫히지 않은 블록이 뒤를 통째로 먹지 않게 비탐욕 매칭 */
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\s/g, '').length;

    return Math.max(1, Math.round(characters / CHARACTERS_PER_MINUTE));
}

function generatePostsData() {
    try {
        /* `.DS_Store` 같은 부산물이 글로 둔갑하지 않게 마크다운만 봅니다 */
        const files = fs.readdirSync(postsDirectory).filter(file => file.endsWith('.md'));

        const bringThumbnailImage = (filename: string) => {
            // 파일명에서 .md 확장자를 제거한 디렉토리 경로를 사용
            const postDir = path.join(imageDirectory, filename.replace('.md', ''));
            
            // 디렉토리가 존재하는지 확인
            if (!fs.existsSync(postDir) || !fs.statSync(postDir).isDirectory()) {
                return '';  // 디렉토리가 없으면 빈 문자열 반환
            }
            
            // 디렉토리 내 첫 번째 이미지 파일을 썸네일로 사용
            const imageFiles = fs.readdirSync(postDir);
            if (imageFiles.length === 0) {
                return '';
            }

            // 디렉토리 내 첫 번째 이미지 파일을 썸네일로 사용하거나 thumbnail 이라는 이름의 파일이 있는지 확인
            const thumbnailFile = imageFiles.find(file => file.includes('thumbnail'));
            if (thumbnailFile) {
                return `/images/posts/${filename.replace('.md', '')}/${thumbnailFile}`;
            }
            
            // 이미지 파일 경로를 상대 경로로 반환 (예: /images/posts/포스트명/이미지명.png)
            return `/images/posts/${filename.replace('.md', '')}/${imageFiles[0]}`;
        }

        const postMetadatas: PostMetadata[] = files.map(filename => {
            const filePath = path.join(postsDirectory, filename);
            const fileContents = fs.readFileSync(filePath, 'utf8');

            const { data, content } = matter(fileContents);
            const thumbnailImage = bringThumbnailImage(filename);

            /*
             * 🔴 slug(URL)와 file(디스크)을 **분리**합니다 — product.md §7-3 R2.
             * 파일명에는 대문자가 섞여 있고(33/41) GitHub Pages 는 대소문자를
             * 구분하므로, 하나로 겸용하면 소문자 URL 로 들어온 요청이 파일을
             * 못 찾거나 대문자 URL 이 정본과 어긋납니다.
             * 프론트매터 `slug:` 오버라이드도 같은 규칙으로 정규화합니다(R5).
             */
            return {
                title: data.title || '',
                date: data.date || '',
                author: data.author || '',
                keywords: data.tags || [],
                description: data.description || '',
                category: data.categories || '',
                slug: toPostSlug(typeof data.slug === 'string' && data.slug ? data.slug : filename),
                file: filename,
                thumbnail: thumbnailImage,
                readingMinutes: calculateReadingMinutes(content),
            } as PostMetadata;
        });

        /*
         * 🔴 멱등성 단언 — 기록된 slug 에 규칙을 한 번 더 걸어도 그대로여야 합니다.
         *
         * 이게 깨지면 런타임에서 `toPostSlug(요청)` 이 어떤 글의 slug 와도 맞지
         * 않아 그 글이 404 가 되고, 404.html 의 인라인 리다이렉트는 정본에
         * 도달하지 못해 되돌아옵니다. 프론트매터 `slug:` 오버라이드(R5)가
         * 정규화를 우회하는 경로라 실제로 일어날 수 있습니다.
         * 한 줄이지만 "slug 만 소문자화" 류의 사고를 **빌드 에러로** 잡습니다.
         */
        const notCanonical = postMetadatas.filter(post => toPostSlug(post.slug) !== post.slug);

        if (notCanonical.length > 0) {
            throw new Error(
                `slug 가 정본 형태가 아닙니다: ${notCanonical
                    .map(post => `"${post.slug}" → "${toPostSlug(post.slug)}"`)
                    .join(', ')}`,
            );
        }

        /*
         * 소문자화로 두 파일이 같은 slug 가 되면 한쪽 글이 영영 열리지 않습니다.
         * 조용히 넘어가면 배포된 뒤에야 드러나므로 빌드를 세웁니다.
         */
        const duplicatedSlugs = postMetadatas
            .map(post => post.slug)
            .filter((slug, index, slugs) => slugs.indexOf(slug) !== index);

        if (duplicatedSlugs.length > 0) {
            throw new Error(
                `slug 가 중복됩니다(파일명 소문자화 결과): ${[...new Set(duplicatedSlugs)].join(', ')}`,
            );
        }

        // sort desc
        postMetadatas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // write to json file
        fs.writeFileSync(jsonOutputPath, JSON.stringify(postMetadatas, null, 2));
        console.log(`✅ Posts data generated successfully: ${jsonOutputPath}`);
    } catch (error) {
        console.error('❌ Error generating posts data:', error);
        /* 조용히 넘어가면 이전 posts-data.json 으로 그대로 배포됩니다 */
        process.exit(1);
    }
}

generatePostsData();