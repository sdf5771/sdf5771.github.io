import styles from './Pagination.module.css';
import { useNavigate } from 'react-router-dom';

interface PaginationProps { 
    currentPage: number, 
    totalPage: number,
    urlPath: string
}

function Pagination({ currentPage, totalPage, urlPath }: PaginationProps) {
    const navigate = useNavigate();

    const handlePrevButtonClick = () => {
        if(currentPage === 1) return;
        navigate(`${urlPath}?page=${currentPage - 1}`);
    }

    const handleNextButtonClick = () => {
        if(currentPage === totalPage) return;
        navigate(`${urlPath}?page=${currentPage + 1}`);
    }

    const handleFirstPageButtonClick = () => {
        navigate(`${urlPath}?page=1`);
    }
    
    const handleLastPageButtonClick = () => {
        navigate(`${urlPath}?page=${totalPage}`);
    }

    return (
        <div className={styles.pagination_container}>
            <button onClick={handleFirstPageButtonClick}>{ '<<' }</button>
            <button onClick={handlePrevButtonClick}>{ '<' }</button>
            {
                Array.from({ length: totalPage }, (_, index) => (
                    <button 
                        key={index} 
                        className={`${styles.page} ${currentPage === index + 1 ? styles.active : ''}`}
                        onClick={() => navigate(`${urlPath}?page=${index + 1}`)}
                    >{index + 1}</button>
                ))
            }
            <button onClick={handleNextButtonClick}>{ '>' }</button>
            <button onClick={handleLastPageButtonClick}>{ '>>' }</button>
        </div>
    )
}

export default Pagination;