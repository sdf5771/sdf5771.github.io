import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import type { PostMetadata } from '../types';
// Markdown File Path
const MARKDOWN_DIRECTORY_PATH = 'public/_posts';
const postsDirectory = path.join(process.cwd(), MARKDOWN_DIRECTORY_PATH);

// Create posts data path
const jsonOutputPath = path.join(process.cwd(), 'public/posts-data.json');

function generatePostsData() {
    try {
        const files = fs.readdirSync(postsDirectory);

        const postMetadatas: PostMetadata[] = files.map(filename => {
            const filePath = path.join(postsDirectory, filename);
            const fileContents = fs.readFileSync(filePath, 'utf8');

            const { data } = matter(fileContents);

            return {
                title: data.title || '',
                date: data.date || '',
                author: data.author || '',
                keywords: data.tags || [],
                description: data.description || '',
                category: data.categories || '',
                slug: filename.replace('.md', ''),
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