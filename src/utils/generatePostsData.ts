import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { PostMetadata } from '../types';

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
        const files = fs.readdirSync(postsDirectory);

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
            return {
                title: data.title || '',
                date: data.date || '',
                author: data.author || '',
                keywords: data.tags || [],
                description: data.description || '',
                category: data.categories || '',
                slug: filename.replace('.md', ''),
                thumbnail: thumbnailImage,
            } as PostMetadata;
        });

        // sort desc
        postMetadatas.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // write to json file
        fs.writeFileSync(jsonOutputPath, JSON.stringify(postMetadatas, null, 2));
        console.log(`✅ Posts data generated successfully: ${jsonOutputPath}`);
    } catch (error) {
        console.error('❌ Error generating posts data:', error);
    }
}

generatePostsData();