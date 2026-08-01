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

            const { data } = matter(fileContents);
            const thumbnailImage = bringThumbnailImage(filename);
            console.log('thumbnailImage ', thumbnailImage);

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
            } as PostMetadata;
        });

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