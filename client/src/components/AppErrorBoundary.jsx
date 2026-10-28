import React from "react";

class AppErrorBoundary extends React.Component {
    state = { hasError: false, message: "" };

    static getDerivedStateFromError(error) {
        return { hasError: true, message: error?.message || "The application encountered an unexpected error." };
    }

    render() {
        if (!this.state.hasError) return this.props.children;
        return <main className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center"><h1 className="text-2xl font-semibold text-gray-800">Something went wrong</h1><p className="max-w-md text-sm text-gray-500">{this.state.message}</p><button type="button" onClick={() => window.location.reload()} className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white">Reload RideShare</button></main>;
    }
}

export default AppErrorBoundary;
