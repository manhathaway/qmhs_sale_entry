import css from './Button.module.css';

const Button = ({
    children,
    className = '',
    ...props
}) => {
    return (
        <button
            className={`${css.button} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;