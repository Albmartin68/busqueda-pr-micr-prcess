import React, { useState } from 'react';
import { XIcon } from './icons/XIcon';
import { UploadCloudIcon } from './icons/UploadCloudIcon';
import { ClockIcon } from './icons/ClockIcon';

interface PublishModalProps {
    onClose: () => void;
    onConfirm: (isScheduled: boolean, date?: string) => void;
}

const PublishModal: React.FC<PublishModalProps> = ({ onClose, onConfirm }) => {
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleDate, setScheduleDate] = useState('');

    const handleConfirm = () => {
        if (isScheduled && !scheduleDate) {
            alert('Por favor, seleccione una fecha y hora para programar.');
            return;
        }
        onConfirm(isScheduled, scheduleDate);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-lg font-bold text-white flex items-center gap-3">
                        <UploadCloudIcon className="w-6 h-6 text-sky-400"/>
                        Publicar Documento
                    </h2>
                    <button onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-slate-700">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </header>
                <div className="p-6 space-y-6">
                    <div className="flex items-center gap-4">
                        <input
                            type="radio"
                            id="publish-now"
                            name="publish-option"
                            checked={!isScheduled}
                            onChange={() => setIsScheduled(false)}
                            className="accent-sky-500"
                        />
                        <label htmlFor="publish-now" className="font-medium">Publicar ahora</label>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-4">
                            <input
                                type="radio"
                                id="publish-later"
                                name="publish-option"
                                checked={isScheduled}
                                onChange={() => setIsScheduled(true)}
                                className="accent-sky-500"
                            />
                            <label htmlFor="publish-later" className="font-medium">Programar para más tarde</label>
                        </div>
                        {isScheduled && (
                            <div className="pl-8">
                                <input
                                    type="datetime-local"
                                    value={scheduleDate}
                                    onChange={(e) => setScheduleDate(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-white"
                                />
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-gray-400">
                        Una vez publicado, el documento será visible públicamente y se generarán las fuentes RSS/HTML correspondientes.
                    </p>
                </div>
                <footer className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md bg-slate-600 hover:bg-slate-500">
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 text-sm font-semibold rounded-md bg-sky-600 hover:bg-sky-500 text-white"
                    >
                        {isScheduled ? 'Programar Publicación' : 'Confirmar Publicación'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PublishModal;