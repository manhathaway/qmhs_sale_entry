import css from './JobDescriptionDialog.module.css';
import Button from './Button';

const JobDescriptionDialog = ({ ...props }) => {
    return (
        <dialog id="expand" className={css.dialog}>
            <textarea
                id={css.textarea}
                {...props}
            />

            <div id={css.closeButtonContainer}>
                <Button
                    type="button"
                    id={css.closeButton}
                    command="close"
                    commandfor="expand"
                >
                    Close
                </Button>
            </div>
        </dialog>
    );
};

export default JobDescriptionDialog;